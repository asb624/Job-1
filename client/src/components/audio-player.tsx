import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className = '' }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolumeControls, setShowVolumeControls] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();
  
  useEffect(() => {
    console.log('Audio Player: Loading file from source:', src);
    // We no longer initialize audio here since we're using the actual audio element
    // in the component render. This ensures better browser compatibility.
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Pause audio on cleanup
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [src]);
  
  // Handle audio loading errors
  const handleError = () => {
    console.error('Audio Player: Error loading audio file');
    setError('Could not load audio file. Try again later.');
  };
  // Handle when audio metadata is loaded (duration, etc.)
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };
  
  // Handle when audio playback ends
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      } else {
        audioRef.current.play();
        animationRef.current = requestAnimationFrame(updateProgress);
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  // Update the progress bar
  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };
  
  // Handle seeking when user changes the progress slider
  const handleProgressChange = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
      
      // If the audio was playing, continue playing
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Handle volume change
  const handleVolumeChange = (value: number[]) => {
    if (audioRef.current) {
      const newVolume = value[0];
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      
      // If volume is now 0, mute; otherwise, unmute
      if (newVolume === 0) {
        audioRef.current.muted = true;
        setIsMuted(true);
      } else if (isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };
  
  // Format time in MM:SS format
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {error ? (
        <div className="flex items-center text-destructive gap-1 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex-1 flex items-center gap-2">
            <Slider 
              value={[currentTime]} 
              min={0} 
              max={duration || 1} 
              step={0.01} 
              onValueChange={handleProgressChange}
              className="flex-1"
            />
          </div>
          
          <div className="text-xs text-muted-foreground w-12 text-right">
            {formatTime(currentTime)}/{formatTime(duration)}
          </div>
          
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleMute}
              onMouseEnter={() => setShowVolumeControls(true)}
              onMouseLeave={() => setShowVolumeControls(false)}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            {showVolumeControls && (
              <div 
                className="absolute bottom-full right-0 p-2 bg-popover shadow-md rounded-lg w-32"
                onMouseEnter={() => setShowVolumeControls(true)}
                onMouseLeave={() => setShowVolumeControls(false)}
              >
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  orientation="horizontal"
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Add an actual audio element to ensure browser compatibility */}
      <audio
        ref={(el) => { audioRef.current = el; }}
        src={src}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        style={{ display: 'none' }}
      />
    </div>
  );
}