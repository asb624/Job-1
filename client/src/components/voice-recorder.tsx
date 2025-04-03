import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, AlertCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

interface VoiceRecorderProps {
  onRecordingComplete: (audioUrl: string) => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

export function VoiceRecorder({ onRecordingComplete, maxDuration = 60 }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  
  // Reset timer when recording stops or component unmounts
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Start recording function
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      // Use our helper function to request microphone access with better error reporting
      const stream = await requestMicrophoneAccess();
      
      // If we couldn't get microphone access, exit early (the helper function already set an error)
      if (!stream) {
        return;
      }
      
      // Try to use audio codecs that are more widely supported
      const mimeTypes = [
        'audio/mp3', 
        'audio/mpeg', 
        'audio/wav', 
        'audio/ogg',
        'audio/webm;codecs=opus',
        'audio/webm'
      ];
      let selectedMimeType = 'audio/webm';
      
      // Find the first supported MIME type
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          console.log(`Using supported audio MIME type: ${type}`);
          break;
        }
      }
      
      console.log(`Final selected MIME type for recording: ${selectedMimeType}`);
      
      // Create a new MediaRecorder instance with the selected MIME type
      const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
      mediaRecorderRef.current = mediaRecorder;
      
      // Check the actual MIME type the recorder is using
      console.log(`MediaRecorder created with actual mimeType: ${mediaRecorder.mimeType}`);
      
      // Set up data handling with improved logging
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log(`Received audio chunk: ${e.data.size} bytes, type: ${e.data.type}`);
        }
      };
      
      // When recording stops, handle the audio data
      mediaRecorder.onstop = () => {
        // Stop all audio tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) {
          setError("No audio data was captured. Please try again.");
          setIsRecording(false);
          return;
        }
        
        handleRecordingComplete();
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start a timer to update recording time
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          
          // Stop recording if it reaches max duration
          if (newTime >= maxDuration) {
            stopRecording();
          }
          
          return newTime;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(`Could not start recording: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Reset timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      console.log("Stop recording called but recorder was not active");
    }
  };
  
  // Helper to request and validate microphone access
  const requestMicrophoneAccess = async (): Promise<MediaStream | null> => {
    try {
      console.log("Requesting microphone access...");
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support microphone access");
      }
      
      // Try to get access with audio only
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      console.log("Microphone access granted:", stream.getAudioTracks().length, "audio tracks");
      return stream;
    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      
      // Provide more specific error messages based on the error
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Microphone access denied. Please allow microphone access in your browser settings.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError("No microphone found. Please connect a microphone and try again.");
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError("Could not start microphone. It may be in use by another application.");
      } else if (err.name === 'OverconstrainedError') {
        setError("Microphone constraints cannot be satisfied. Please try different settings.");
      } else {
        setError(`Could not access microphone: ${err.message || err.name || "Unknown error"}`);
      }
      
      return null;
    }
  };

  // Handle the recording after it's complete - upload to server
  const handleRecordingComplete = async () => {
    // Determine the best output format based on the chunks we received
    // Try to preserve the original format from the recorder when possible
    let outputType = 'audio/mp3'; // Default fallback
    
    // Check if we have chunks with a specific type
    if (audioChunksRef.current.length > 0 && audioChunksRef.current[0].type) {
      const firstChunkType = audioChunksRef.current[0].type;
      console.log(`First chunk has type: ${firstChunkType}`);
      
      // Use the original type if it's one of our supported formats
      if (firstChunkType.includes('mp3') || 
          firstChunkType.includes('mpeg') || 
          firstChunkType.includes('wav') ||
          firstChunkType.includes('ogg') ||
          firstChunkType.includes('webm')) {
        outputType = firstChunkType;
        console.log(`Using original format: ${outputType}`);
      }
    }
    
    // Create a blob from all audio chunks with the determined format
    const audioBlob = new Blob(audioChunksRef.current, { type: outputType });
    console.log(`Created final blob with type: ${outputType}, size: ${audioBlob.size} bytes`);
    
    // Upload the audio file to the server
    await uploadVoiceNote(audioBlob);
  };
  
  // Upload the voice note to the server with enhanced error handling and debugging
  const uploadVoiceNote = async (audioBlob: Blob) => {
    setIsUploading(true);
    console.log("Starting voice note upload, blob size:", audioBlob.size, "bytes, type:", audioBlob.type);
    
    if (audioBlob.size === 0) {
      setError("Recording failed: audio file is empty (0 bytes)");
      setIsUploading(false);
      return;
    }
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      
      // Get the appropriate file extension based on the mime type
      let fileExtension = '.mp3'; // Default
      if (audioBlob.type.includes('webm')) {
        fileExtension = '.webm';
      } else if (audioBlob.type.includes('wav')) {
        fileExtension = '.wav';
      } else if (audioBlob.type.includes('ogg')) {
        fileExtension = '.ogg';
      } else if (audioBlob.type.includes('mpeg') || audioBlob.type.includes('mp3')) {
        fileExtension = '.mp3';
      }
      
      const filename = `voice-note-${Date.now()}${fileExtension}`;
      console.log(`Using filename with extension: ${filename} for type: ${audioBlob.type}`);
      formData.append('voiceNote', audioBlob, filename);
      
      console.log("Uploading voice note with filename:", filename);
      
      // Log browser details for debugging
      console.log("Browser details:", 
        navigator.userAgent, 
        "localStorage available:", typeof localStorage !== 'undefined'
      );
      
      // Create a URL for the blob for debugging
      const blobUrl = URL.createObjectURL(audioBlob);
      console.log("Local Blob URL (for debugging):", blobUrl);
      
      // Upload the file with credentials to ensure cookies are sent
      const response = await fetch('/api/upload/voice', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include credentials like cookies for authentication
      });
      
      console.log("Upload response status:", response.status, response.statusText);
      
      // Get and log response headers for debugging
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log("Response headers:", headers);
      
      // Explicitly handle different error statuses
      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          console.error("Upload error response:", errorText);
        } catch (textError) {
          console.error("Could not read error response text:", textError);
          errorText = "Could not read error details";
        }
        
        // Handle specific status codes
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.");
        } else if (response.status === 413) {
          throw new Error("File too large. Maximum size is 5MB.");
        } else {
          throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
      }
      
      // Parse the response JSON
      let data;
      try {
        data = await response.json();
        console.log("Upload response data:", data);
      } catch (parseError) {
        console.error("Error parsing JSON response:", parseError);
        throw new Error("Invalid response from server");
      }
      
      if (!data.fileUrl) {
        throw new Error("No file URL returned from server");
      }
      
      // Log the returned URL for debugging
      console.log("Server returned file URL:", data.fileUrl);
      
      // Verify the URL format
      if (!data.fileUrl.startsWith('/uploads/') && !data.fileUrl.startsWith('http')) {
        console.warn("Warning: Returned URL may not be properly formatted:", data.fileUrl);
      }
      
      // Callback with the URL of the uploaded file
      onRecordingComplete(data.fileUrl);
      
      // Reset state after successful upload
      setIsRecording(false);
      audioChunksRef.current = [];
      
      toast({
        title: "Voice Note Uploaded",
        description: "Your voice note has been uploaded successfully.",
        variant: "default"
      });
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
      
    } catch (err) {
      console.error("Error uploading voice note:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown upload error";
      setError(`Failed to upload voice note: ${errorMessage}`);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Format the recording time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {error && (
        <div className="flex items-center text-destructive gap-1 text-sm mb-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        {isRecording ? (
          <>
            <div className="text-sm font-medium mr-2">
              {formatTime(recordingTime)}
            </div>
            <div className="animate-pulse bg-destructive w-2 h-2 rounded-full mr-2"></div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={stopRecording}
              disabled={isUploading}
            >
              <Square className="h-4 w-4 mr-1" />
              Stop
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={startRecording}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-1" />
                Record Voice
              </>
            )}
          </Button>
        )}
      </div>
      
      {isRecording && (
        <p className="text-xs text-muted-foreground">
          Click stop when done (max {maxDuration} seconds)
        </p>
      )}
    </div>
  );
}