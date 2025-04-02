import React from 'react';
import { AudioPlayer } from './audio-player';
import { Card, CardContent } from '@/components/ui/card';

interface VoiceMessageProps {
  src: string;
  isCurrentUser: boolean;
  timestamp: Date;
}

export function VoiceMessage({ src, isCurrentUser, timestamp }: VoiceMessageProps) {
  // Format the timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <Card className={`max-w-[80%] ${isCurrentUser ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto'}`}>
      <CardContent className="p-3">
        <AudioPlayer src={src} />
        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {formatTime(timestamp)}
        </div>
      </CardContent>
    </Card>
  );
}