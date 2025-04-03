import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, AlertCircle, Loader2 } from 'lucide-react';
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
  
  // Try to create a MediaRecorder with a supported MIME type
  const createMediaRecorder = (stream: MediaStream): MediaRecorder | null => {
    try {
      // Try to use audio codecs that are more widely supported
      const mimeTypes = [
        'audio/mp3', 
        'audio/mpeg', 
        'audio/wav', 
        'audio/ogg',
        'audio/webm;codecs=opus',
        'audio/webm'
      ];
      
      // Check if any of the MIME types are supported
      console.log("Checking supported MIME types:");
      let selectedMimeType = '';
      
      for (const type of mimeTypes) {
        try {
          const isSupported = MediaRecorder.isTypeSupported(type);
          console.log(`- ${type}: ${isSupported ? 'supported' : 'not supported'}`);
          
          if (isSupported && !selectedMimeType) {
            selectedMimeType = type;
          }
        } catch (err) {
          console.error(`Error checking support for ${type}:`, err);
        }
      }
      
      // Try using the selected MIME type if available
      if (selectedMimeType) {
        try {
          console.log(`Creating MediaRecorder with selected type: ${selectedMimeType}`);
          const recorder = new MediaRecorder(stream, { mimeType: selectedMimeType });
          console.log(`Successfully created MediaRecorder with: ${recorder.mimeType}`);
          return recorder;
        } catch (err) {
          console.error(`Failed to create MediaRecorder with ${selectedMimeType}:`, err);
        }
      }
      
      // Fall back to browser default
      console.log("Trying browser default MediaRecorder (no MIME type)");
      try {
        const recorder = new MediaRecorder(stream);
        console.log(`Successfully created default MediaRecorder with: ${recorder.mimeType}`);
        return recorder;
      } catch (err) {
        console.error("Failed to create default MediaRecorder:", err);
        setError("Your browser doesn't support audio recording. Please try a different browser.");
        return null;
      }
    } catch (err) {
      console.error("Error in createMediaRecorder:", err);
      setError("Failed to initialize audio recording. Please try a different browser.");
      return null;
    }
  };

  // Start recording function
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await requestMicrophoneAccess();
      
      // If we couldn't get microphone access, exit early
      if (!stream) {
        return;
      }
      
      // Create a MediaRecorder with a supported format
      const mediaRecorder = createMediaRecorder(stream);
      
      if (!mediaRecorder) {
        // Error is already set by createMediaRecorder
        return;
      }
      
      // Store the media recorder reference
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data handling with improved logging
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
          console.log(`Received audio chunk: ${e.data.size} bytes, type: ${e.data.type}`);
        } else {
          console.log("Received empty audio chunk");
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
      
      // Handle unexpected error
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setError("Recording error occurred. Please try again.");
        stopRecording();
      };
      
      // Start capturing audio data at regular intervals
      mediaRecorder.start(1000); // Capture in 1-second chunks
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
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error("Error stopping media recorder:", err);
      }
      
      // Reset timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      console.log("Stop recording called but recorder was not active");
    }
  };
  
  // Handle the recording after it's complete - upload to server
  const handleRecordingComplete = async () => {
    try {
      // Determine the best output format based on the chunks we received
      let outputType = 'audio/mpeg'; // Default fallback
      
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
        }
      }
      
      console.log(`Using output format: ${outputType}`);
      
      // Create a blob from all audio chunks with the determined format
      const audioBlob = new Blob(audioChunksRef.current, { type: outputType });
      console.log(`Created final blob: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      
      if (audioBlob.size === 0) {
        throw new Error("Recording resulted in empty audio file");
      }
      
      // Upload the audio file to the server
      await uploadVoiceNote(audioBlob);
    } catch (err) {
      console.error("Error handling recording completion:", err);
      setError(`Recording failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      setIsRecording(false);
    }
  };
  
  // Upload the voice note to the server with enhanced error handling and debugging
  const uploadVoiceNote = async (audioBlob: Blob) => {
    setIsUploading(true);
    console.log("Starting voice note upload, blob size:", audioBlob.size, "bytes, type:", audioBlob.type);
    
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
      
      const filename = `voice-${Date.now()}${fileExtension}`;
      console.log(`Using filename: ${filename} for type: ${audioBlob.type}`);
      
      // Add the file to the form data with the determined filename
      formData.append('voiceNote', audioBlob, filename);
      
      // Create a URL for the blob for debugging
      const blobUrl = URL.createObjectURL(audioBlob);
      console.log("Local Blob URL:", blobUrl);
      
      // Upload the file with credentials to ensure cookies are sent
      const response = await fetch('/api/upload/voice', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      console.log("Upload response status:", response.status, response.statusText);
      
      // Explicitly handle different error statuses
      if (!response.ok) {
        let errorText = await response.text();
        
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
      const data = await response.json();
      console.log("Upload response data:", data);
      
      if (!data.fileUrl) {
        throw new Error("No file URL returned from server");
      }
      
      // Log the returned URL for debugging
      console.log("Server returned file URL:", data.fileUrl);
      
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