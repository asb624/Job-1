import React, { useEffect, useState } from 'react';
import { AudioPlayer } from './audio-player';
import { Card, CardContent } from '@/components/ui/card';

interface VoiceMessageProps {
  src: string;
  isCurrentUser: boolean;
  timestamp: Date;
}

export function VoiceMessage({ src, isCurrentUser, timestamp }: VoiceMessageProps) {
  const [audioSrc, setAudioSrc] = useState<string>(src);
  
  // Format the timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Add proper logging and ensure src has the right format
  useEffect(() => {
    console.log('Voice Message: Original source path:', src);
    
    // Handle the case where the src might be a relative path without the domain
    if (src && src.startsWith('/uploads/')) {
      const fullPath = `${window.location.origin}${src}`;
      console.log('Voice Message: Using full URL path:', fullPath);
      setAudioSrc(fullPath);
    } else {
      setAudioSrc(src);
    }
  }, [src]);

  return (
    <Card className={`max-w-[80%] ${isCurrentUser ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto'}`}>
      <CardContent className="p-3">
        <AudioPlayer src={audioSrc} />
        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {formatTime(timestamp)}
        </div>
      </CardContent>
    </Card>
  );
}