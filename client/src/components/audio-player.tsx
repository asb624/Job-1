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
  
  const [audioSrc, setAudioSrc] = useState<string>(src);

  // Process the audio source URL to handle potential issues
  useEffect(() => {
    console.log('Audio Player: Original source:', src);
    
    if (!src) {
      console.error('Audio Player: Empty source URL');
      setError('Missing audio source');
      return;
    }
    
    // Check if it's a relative path without domain
    if (src.startsWith('/')) {
      const fullUrl = `${window.location.origin}${src}`;
      console.log('Audio Player: Converting to full URL:', fullUrl);
      setAudioSrc(fullUrl);
    } else {
      setAudioSrc(src);
    }
    
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
  
  // Handle audio loading errors with more detailed logging
  const handleError = () => {
    console.error(`Audio Player: Error loading audio file from: ${audioSrc}`);
    
    // Check if file exists with a HEAD request
    if (audioSrc && audioSrc.startsWith(window.location.origin)) {
      fetch(audioSrc, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) {
            console.error(`Audio Player: File not found, status: ${response.status}`);
            setError(`Audio file not found (${response.status}). Try again later.`);
          } else {
            console.log(`Audio Player: File exists but couldn't be played`);
            setError('Audio file exists but could not be played. Format may be unsupported.');
          }
        })
        .catch(err => {
          console.error('Audio Player: Error checking file:', err);
          setError('Could not load audio file. Network error or file does not exist.');
        });
    } else {
      setError('Could not load audio file. Try again later.');
    }
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
  
  // Toggle play/pause with improved error handling
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        console.log('Audio Player: Pausing playback');
        audioRef.current.pause();
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        setIsPlaying(false);
      } else {
        console.log('Audio Player: Starting playback');
        
        // Handle potential play promise rejection (autoplay policy, etc.)
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Audio Player: Playback started successfully');
              animationRef.current = requestAnimationFrame(updateProgress);
              setIsPlaying(true);
            })
            .catch(err => {
              console.error('Audio Player: Playback was prevented:', err);
              setError('Browser prevented audio playback. Try clicking again.');
              setIsPlaying(false);
            });
        }
      }
    } else {
      console.error('Audio Player: Audio element reference is null');
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
      
      // If the audio was playing, continue playing with error handling
      if (isPlaying) {
        console.log('Audio Player: Resuming playback after seek');
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            console.error('Audio Player: Error resuming after seek:', err);
            setIsPlaying(false);
          });
        }
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
        src={audioSrc}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        style={{ display: 'none' }}
      />
      
      {/* Debug information in development mode */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="text-xs text-muted-foreground mt-1">
          Source URL: {audioSrc}
        </div>
      )}
    </div>
  );
}