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
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up data handling
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
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
      setError("Could not access microphone. Please ensure microphone access is allowed.");
      console.error("Error accessing microphone:", err);
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
    }
  };

  // Handle the recording after it's complete - upload to server
  const handleRecordingComplete = async () => {
    // Create a blob from all audio chunks
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    // Upload the audio file to the server
    await uploadVoiceNote(audioBlob);
  };
  
  // Upload the voice note to the server
  const uploadVoiceNote = async (audioBlob: Blob) => {
    setIsUploading(true);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('voiceNote', audioBlob, `voice-note-${Date.now()}.webm`);
      
      // Upload the file
      const response = await fetch('/api/upload/voice', {
        method: 'POST',
        body: formData,
        // No need to set Content-Type header as it's automatically set with FormData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Callback with the URL of the uploaded file
      onRecordingComplete(data.fileUrl);
      
      // Reset state after successful upload
      setIsRecording(false);
      audioChunksRef.current = [];
    } catch (err) {
      console.error("Error uploading voice note:", err);
      setError("Failed to upload voice note. Please try again.");
      toast({
        title: "Upload Failed",
        description: "Could not upload voice note. Please try again.",
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