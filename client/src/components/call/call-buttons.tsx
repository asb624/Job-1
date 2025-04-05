import React from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { Phone, Video } from 'lucide-react';
import { useCall } from './call-provider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CallButtonsProps {
  recipientId: number;
  recipientUsername: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'icon-only';
}

export function CallButtons({ 
  recipientId,
  recipientUsername,
  size = 'md',
  variant = 'default'
}: CallButtonsProps) {
  const { t } = useTranslation();
  const { startCall } = useCall();

  const handleVoiceCall = () => {
    startCall(recipientId, recipientUsername, 'audio');
  };

  const handleVideoCall = () => {
    startCall(recipientId, recipientUsername, 'video');
  };

  // Size classes for buttons
  const buttonSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  if (variant === 'icon-only') {
    return (
      <TooltipProvider>
        <div className="flex space-x-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleVoiceCall}
                variant="outline"
                size="icon"
                className={`rounded-full ${buttonSizeClasses[size]} border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700`}
              >
                <Phone className={iconSizeClasses[size]} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Voice Call')}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleVideoCall}
                variant="outline"
                size="icon"
                className={`rounded-full ${buttonSizeClasses[size]} border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700`}
              >
                <Video className={iconSizeClasses[size]} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('Video Call')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex space-x-2">
      <Button
        onClick={handleVoiceCall}
        variant="outline"
        size="sm"
        className="border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
      >
        <Phone className="mr-1 h-4 w-4" />
        {t('Voice')}
      </Button>
      <Button
        onClick={handleVideoCall}
        variant="outline"
        size="sm"
        className="border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
      >
        <Video className="mr-1 h-4 w-4" />
        {t('Video')}
      </Button>
    </div>
  );
}