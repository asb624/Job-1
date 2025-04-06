import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { 
  CallState, 
  CallType, 
  startCall,
  setupCallSignaling,
  addEventListener
} from '@/lib/webrtc';
import { CallDialog } from '@/components/call-dialog';
import { useTranslation } from 'react-i18next';

interface CallButtonsProps {
  user: User | null | undefined;
  otherUser: User | null | undefined;
  conversationId: number;
}

export function CallButtons({ user, otherUser, conversationId }: CallButtonsProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Call state
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [callType, setCallType] = useState<CallType>(CallType.AUDIO);
  const [remotePeerId, setRemotePeerId] = useState<number | undefined>(undefined);
  
  // Set up WebRTC signaling when user is available
  useEffect(() => {
    if (user?.id) {
      // Store user ID in session storage for WebRTC
      sessionStorage.setItem('userId', user.id.toString());
      
      // Set up call signaling
      setupCallSignaling(user.id);
      
      // Listen for incoming calls
      const removeIncomingCallListener = addEventListener('incoming-call', (data) => {
        console.log('Incoming call:', data);
        
        // Only accept calls if we're not already in one
        if (callState === CallState.IDLE) {
          const incomingCallerId = data.from;
          
          // Only accept calls from the current conversation partner
          if (otherUser && incomingCallerId === otherUser.id) {
            setCallState(CallState.RECEIVING);
            setCallType(data.callType);
            setRemotePeerId(incomingCallerId);
            setCallDialogOpen(true);
            
            // Play ringtone
            const audio = new Audio('/sounds/ringtone.mp3');
            audio.loop = true;
            audio.play().catch(err => console.warn('Could not play ringtone:', err));
            
            // Store audio element to stop it later
            (window as any).ringtone = audio;
          }
        }
      });
      
      // Listen for call rejections
      const removeCallRejectedListener = addEventListener('call-rejected', (data) => {
        console.log('Call rejected:', data);
        
        toast({
          title: t('Call Rejected'),
          description: t('The user declined your call.'),
          variant: 'default'
        });
        
        setCallState(CallState.ENDED);
        setTimeout(() => {
          setCallDialogOpen(false);
          setCallState(CallState.IDLE);
        }, 2000);
      });
      
      // Listen for call ended
      const removeCallEndedListener = addEventListener('call-ended', (data) => {
        console.log('Call ended:', data);
        
        if (callState === CallState.CONNECTED) {
          toast({
            title: t('Call Ended'),
            description: t('The call has ended.'),
            variant: 'default'
          });
        }
        
        setCallState(CallState.ENDED);
        setTimeout(() => {
          setCallDialogOpen(false);
          setCallState(CallState.IDLE);
        }, 2000);
      });
      
      // Listen for connection established
      const removeCallConnectedListener = addEventListener('call-connected', () => {
        console.log('Call connected');
        setCallState(CallState.CONNECTED);
        
        // Stop ringtone if it's playing
        if ((window as any).ringtone) {
          (window as any).ringtone.pause();
          (window as any).ringtone = null;
        }
      });
      
      // Listen for errors
      const removeCallErrorListener = addEventListener('call-error', (data) => {
        console.error('Call error:', data);
        
        toast({
          title: t('Call Error'),
          description: data.error || t('Something went wrong with the call.'),
          variant: 'destructive'
        });
        
        setCallState(CallState.ENDED);
        setTimeout(() => {
          setCallDialogOpen(false);
          setCallState(CallState.IDLE);
        }, 2000);
      });
      
      // Clean up listeners on unmount
      return () => {
        removeIncomingCallListener();
        removeCallRejectedListener();
        removeCallEndedListener();
        removeCallConnectedListener();
        removeCallErrorListener();
        
        // Stop ringtone if it's playing
        if ((window as any).ringtone) {
          (window as any).ringtone.pause();
          (window as any).ringtone = null;
        }
      };
    }
  }, [user?.id, callState, otherUser, toast, t]);
  
  // Start an audio call
  const handleAudioCall = () => {
    if (!user || !otherUser) {
      console.error('Missing user information');
      return;
    }
    
    // Set call state
    setCallType(CallType.AUDIO);
    setCallState(CallState.CALLING);
    setRemotePeerId(otherUser.id);
    setCallDialogOpen(true);
    
    // Start the call
    const callSuccessful = startCall(otherUser.id, conversationId, CallType.AUDIO);
    
    if (!callSuccessful) {
      toast({
        title: t('Call Error'),
        description: t('Could not start the call. Please try again.'),
        variant: 'destructive'
      });
      
      setCallDialogOpen(false);
      setCallState(CallState.IDLE);
    }
  };
  
  // Start a video call
  const handleVideoCall = () => {
    if (!user || !otherUser) {
      console.error('Missing user information');
      return;
    }
    
    // Set call state
    setCallType(CallType.VIDEO);
    setCallState(CallState.CALLING);
    setRemotePeerId(otherUser.id);
    setCallDialogOpen(true);
    
    // Start the call
    const callSuccessful = startCall(otherUser.id, conversationId, CallType.VIDEO);
    
    if (!callSuccessful) {
      toast({
        title: t('Call Error'),
        description: t('Could not start the call. Please try again.'),
        variant: 'destructive'
      });
      
      setCallDialogOpen(false);
      setCallState(CallState.IDLE);
    }
  };
  
  // Handle accepting a call
  const handleAcceptCall = (callType: CallType) => {
    setCallType(callType);
    setCallState(CallState.CONNECTED);
    
    // Stop ringtone if it's playing
    if ((window as any).ringtone) {
      (window as any).ringtone.pause();
      (window as any).ringtone = null;
    }
  };
  
  // Handle rejecting a call
  const handleRejectCall = () => {
    setCallState(CallState.IDLE);
    
    // Stop ringtone if it's playing
    if ((window as any).ringtone) {
      (window as any).ringtone.pause();
      (window as any).ringtone = null;
    }
  };
  
  // Handle ending a call
  const handleEndCall = () => {
    setCallState(CallState.ENDED);
    setTimeout(() => {
      setCallState(CallState.IDLE);
    }, 2000);
  };
  
  return (
    <>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          title={t('Audio Call')}
          onClick={handleAudioCall}
          disabled={
            !user || 
            !otherUser || 
            callState !== CallState.IDLE
          }
        >
          <Phone className="h-4 w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          title={t('Video Call')}
          onClick={handleVideoCall}
          disabled={
            !user || 
            !otherUser || 
            callState !== CallState.IDLE
          }
        >
          <Video className="h-4 w-4" />
        </Button>
      </div>
      
      <CallDialog
        open={callDialogOpen}
        onOpenChange={setCallDialogOpen}
        callState={callState}
        callType={callType}
        remoteUser={otherUser || undefined}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
        onEnd={handleEndCall}
        remotePeerId={remotePeerId}
      />
    </>
  );
}