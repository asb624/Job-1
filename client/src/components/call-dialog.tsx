import React, { useEffect, useRef, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Video, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from 'lucide-react';
import { CallState, CallType, acceptCall, rejectCall, endCall } from '@/lib/webrtc';
import { User } from '@shared/schema';
import { useTranslation } from 'react-i18next';

interface CallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callState: CallState;
  callType: CallType;
  remoteUser?: User;
  onAccept?: (callType: CallType) => void;
  onReject?: () => void;
  onEnd?: () => void;
  remotePeerId?: number;
}

export function CallDialog({
  open,
  onOpenChange,
  callState,
  callType,
  remoteUser,
  onAccept,
  onReject,
  onEnd,
  remotePeerId
}: CallDialogProps) {
  const { t } = useTranslation();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Get user's media stream when the dialog is opened
  useEffect(() => {
    // Only request media when the dialog is open and we're not in IDLE state
    if (open && callState !== CallState.IDLE) {
      // Get the appropriate media constraints
      const constraints = {
        audio: true,
        video: callType === CallType.VIDEO
      };

      // Request user media
      navigator.mediaDevices.getUserMedia(constraints)
        .then(handleLocalStream)
        .catch(handleMediaError);
    }

    // Clean up when dialog closes
    return () => {
      // Stop local stream if it exists
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    };
  }, [open, callState, callType]);

  // Handle getting local media stream
  function handleLocalStream(stream: MediaStream) {
    // Store the stream reference for later cleanup
    localStreamRef.current = stream;

    // Display local video if video call
    if (callType === CallType.VIDEO && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    // Mute streams if muted
    if (isMuted) {
      stream.getAudioTracks().forEach(track => track.enabled = false);
    }

    // Turn off video if video is off
    if (isVideoOff && callType === CallType.VIDEO) {
      stream.getVideoTracks().forEach(track => track.enabled = false);
    }
  }

  // Handle remote media stream
  function handleRemoteStream(stream: MediaStream) {
    // Display remote video
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
    }
  }

  // Handle media errors
  function handleMediaError(error: Error) {
    console.error('Error accessing media devices:', error);
    
    // Create more detailed error message based on error type
    let errorMessage = '';
    
    // If permission denied or device issues, show appropriate message
    if (error.name === 'NotAllowedError') {
      // Handle permission denied
      errorMessage = t('You need to allow access to your camera and microphone to make calls.');
    } else if (error.name === 'NotFoundError') {
      // Handle no devices found
      errorMessage = t('No camera or microphone found. Please connect a device and try again.');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      // Handle device in use by another application
      errorMessage = t('Cannot access your camera or microphone. They might be in use by another application.');
    } else if (error.name === 'OverconstrainedError') {
      // Handle constraints that cannot be satisfied by the current device
      errorMessage = t('Your camera does not meet the required specifications. Please try a different camera.');
    } else if (error.name === 'SecurityError') {
      // Handle security errors (e.g., insecure origins)
      errorMessage = t('Media access denied due to security restrictions.');
    } else if (error.name === 'AbortError') {
      // Handle when the user agent aborts the operation
      errorMessage = t('The operation was aborted. Please try again.');
    } else {
      // Handle other errors
      errorMessage = t('An error occurred while trying to access your camera and microphone: ') + error.message;
    }
    
    // Set error message in state instead of using alert
    setMediaError(errorMessage);
    
    // If we're in a calling state, we need to clean up any partially established call
    if (remotePeerId && (callState === CallState.CALLING || callState === CallState.CONNECTED)) {
      endCall(remotePeerId);
      if (onEnd) {
        onEnd();
      }
    }
    
    // Don't close the dialog immediately, so user can see the error
    // We'll show a close button instead
    // After 5 seconds, close automatically
    setTimeout(() => {
      onOpenChange(false);
    }, 5000);
  }

  // Handle accepting the call
  const handleAcceptCall = () => {
    if (!remotePeerId || !localStreamRef.current) return;
    
    acceptCall(remotePeerId, callType, localStreamRef.current);
    
    if (onAccept) {
      onAccept(callType);
    }
  };

  // Handle rejecting the call
  const handleRejectCall = () => {
    if (!remotePeerId) return;
    
    rejectCall(remotePeerId);
    
    if (onReject) {
      onReject();
    }
    
    onOpenChange(false);
  };

  // Handle ending the call
  const handleEndCall = () => {
    if (!remotePeerId) return;
    
    endCall(remotePeerId);
    
    if (onEnd) {
      onEnd();
    }
    
    onOpenChange(false);
  };

  // Toggle mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      // When toggling mute, we want to set enabled to the opposite of isMuted
      // If currently muted (isMuted=true), we want to enable the track (enabled=true)
      // If currently unmuted (isMuted=false), we want to disable the track (enabled=false)
      const newMuteState = !isMuted;
      audioTracks.forEach(track => track.enabled = !newMuteState);
      setIsMuted(newMuteState);
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current && callType === CallType.VIDEO) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      // When toggling video, we want to set enabled to the opposite of isVideoOff
      // If video is off (isVideoOff=true), we want to enable the track (enabled=true)
      // If video is on (isVideoOff=false), we want to disable the track (enabled=false)
      const newVideoOffState = !isVideoOff;
      videoTracks.forEach(track => track.enabled = !newVideoOffState);
      setIsVideoOff(newVideoOffState);
    }
  };

  // Get dialog title based on call state
  const getDialogTitle = () => {
    switch (callState) {
      case CallState.CALLING:
        return t('Calling...');
      case CallState.RECEIVING:
        return t('Incoming Call');
      case CallState.CONNECTED:
        return t('Connected');
      case CallState.ENDED:
        return t('Call Ended');
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4 gap-4">
          {/* Display media error if any */}
          {mediaError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4 w-full" role="alert">
              <strong className="font-bold">{t('Error')}: </strong>
              <span className="block sm:inline">{mediaError}</span>
              <button 
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
                onClick={() => onOpenChange(false)}
              >
                <span className="text-red-500">×</span>
              </button>
            </div>
          )}
          
          {/* Display user avatar */}
          <Avatar className="h-24 w-24">
            <AvatarImage src={remoteUser?.avatar || ''} alt={remoteUser?.username || ''} />
            <AvatarFallback>
              {remoteUser?.username?.substring(0, 2).toUpperCase() || 'UN'}
            </AvatarFallback>
          </Avatar>
          
          {/* Display user name */}
          <h3 className="text-xl font-semibold">
            {remoteUser?.username || t('Unknown User')}
          </h3>
          
          {/* Call type indicator */}
          <div className="flex items-center gap-2">
            {callType === CallType.AUDIO ? (
              <Phone className="h-5 w-5" />
            ) : (
              <Video className="h-5 w-5" />
            )}
            <span>
              {callType === CallType.AUDIO ? t('Audio Call') : t('Video Call')}
            </span>
          </div>
          
          {/* Video display for video calls */}
          {callType === CallType.VIDEO && callState === CallState.CONNECTED && (
            <div className="relative w-full h-72 bg-gray-100 rounded-lg overflow-hidden">
              {/* Remote video (main) */}
              <video 
                ref={remoteVideoRef} 
                data-ref="remote-video"
                id="remote-video"
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Local video (small overlay) */}
              <video 
                ref={localVideoRef}
                data-ref="local-video" 
                id="local-video"
                autoPlay 
                playsInline 
                muted 
                className="absolute bottom-2 right-2 w-1/4 h-1/4 object-cover rounded border-2 border-white"
              />
            </div>
          )}
          
          {/* Just show local video when calling */}
          {callType === CallType.VIDEO && callState === CallState.CALLING && (
            <div className="relative w-full h-72 bg-gray-100 rounded-lg overflow-hidden">
              <video 
                ref={localVideoRef} 
                autoPlay 
                playsInline 
                muted 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-center sm:justify-center">
          {/* Show accept/reject buttons when receiving call */}
          {callState === CallState.RECEIVING && (
            <div className="flex gap-4">
              <Button 
                variant="destructive" 
                onClick={handleRejectCall}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                {t('Decline')}
              </Button>
              <Button 
                variant="default" 
                onClick={handleAcceptCall}
              >
                <Phone className="h-4 w-4 mr-2" />
                {t('Accept')}
              </Button>
            </div>
          )}
          
          {/* Show end call button when connected or calling */}
          {(callState === CallState.CONNECTED || callState === CallState.CALLING) && (
            <div className="flex gap-4">
              {/* Mute button */}
              <Button 
                variant="outline" 
                onClick={toggleMute}
              >
                {isMuted ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              
              {/* Video toggle button (only for video calls) */}
              {callType === CallType.VIDEO && (
                <Button 
                  variant="outline" 
                  onClick={toggleVideo}
                >
                  {isVideoOff ? (
                    <VideoOff className="h-4 w-4" />
                  ) : (
                    <VideoIcon className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {/* End call button */}
              <Button 
                variant="destructive" 
                onClick={handleEndCall}
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                {t('End Call')}
              </Button>
            </div>
          )}
          
          {/* Show call ended message */}
          {callState === CallState.ENDED && (
            <div className="text-center">
              <p>{t('Call has ended')}</p>
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="mt-2"
              >
                {t('Close')}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}