import React, { useEffect, useRef } from 'react';
import { useCall } from './call-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function CallInterface() {
  const { t } = useTranslation();
  const {
    callState,
    callType,
    localStream,
    remoteStream,
    incomingCall,
    answerCall,
    endCall,
    rejectCall
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = React.useState(true);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream && callType === 'video') {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  // If not in a call, don't render anything
  if (callState === 'idle') {
    return null;
  }

  // Render the incoming call UI
  if (callState === 'receiving' && incomingCall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
        <Card className="w-full max-w-md border-teal-100">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarFallback className="bg-teal-100 text-teal-800 text-xl">
                  {incomingCall.from.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-teal-800">
                {incomingCall.from.username}
              </h2>
              <p className="text-gray-600">
                {incomingCall.callType === 'video' 
                  ? t('Incoming video call') 
                  : t('Incoming audio call')}
              </p>
            </div>
            
            <div className="flex justify-center space-x-4 pt-4">
              <Button
                onClick={rejectCall}
                size="lg"
                className="rounded-full h-14 w-14 p-0 bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button
                onClick={answerCall}
                size="lg"
                className="rounded-full h-14 w-14 p-0 bg-green-500 hover:bg-green-600"
              >
                <Phone className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render outgoing call UI
  if (callState === 'calling' && callType) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/30">
        <Card className="w-full max-w-md border-teal-100">
          <CardContent className="p-6 space-y-4">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-teal-100 flex items-center justify-center animate-pulse">
                <Phone className="h-10 w-10 text-teal-600" />
              </div>
              <h2 className="text-xl font-semibold text-teal-800">
                {t('Calling...')}
              </h2>
              <p className="text-gray-600">
                {callType === 'video' 
                  ? t('Video call in progress') 
                  : t('Audio call in progress')}
              </p>
            </div>
            
            <div className="flex justify-center pt-4">
              <Button
                onClick={endCall}
                size="lg"
                className="rounded-full h-14 w-14 p-0 bg-red-500 hover:bg-red-600"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render ongoing call UI
  if (callState === 'ongoing') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
        {/* Call controls header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full text-white hover:bg-white/20"
            onClick={() => endCall()}
          >
            <X className="h-6 w-6" />
          </Button>
          <div className="text-white font-medium">
            {callType === 'video' ? t('Video Call') : t('Audio Call')}
          </div>
          <div className="w-10"></div> {/* Spacer for alignment */}
        </div>

        {/* Main call area */}
        <div className="flex-1 flex items-center justify-center relative">
          {/* Remote video (full screen) */}
          {callType === 'video' && remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {/* Audio-only UI */}
          {callType === 'audio' && (
            <div className="flex flex-col items-center justify-center h-full">
              <Avatar className="h-32 w-32 mb-6">
                <AvatarFallback className="bg-teal-100 text-teal-800 text-4xl">
                  {incomingCall?.from.username[0].toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold text-white mb-2">
                {incomingCall?.from.username || ''}
              </h2>
              <p className="text-gray-400">
                {t('Audio call in progress')}
              </p>
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          {callType === 'video' && localStream && (
            <div className="absolute bottom-20 right-4 w-1/4 max-w-[160px] rounded-lg overflow-hidden border-2 border-white shadow-lg">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="p-6 bg-black/80 flex justify-center space-x-4">
          <Button
            onClick={toggleMute}
            size="lg"
            variant="outline"
            className={`rounded-full h-14 w-14 p-0 ${
              isMuted ? 'bg-red-500 hover:bg-red-600 border-red-500' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6 text-white" /> : <Mic className="h-6 w-6 text-white" />}
          </Button>

          {callType === 'video' && (
            <Button
              onClick={toggleVideo}
              size="lg"
              variant="outline"
              className={`rounded-full h-14 w-14 p-0 ${
                !isVideoEnabled ? 'bg-red-500 hover:bg-red-600 border-red-500' : 'bg-gray-700 hover:bg-gray-600 border-gray-600'
              }`}
            >
              {!isVideoEnabled ? <VideoOff className="h-6 w-6 text-white" /> : <Video className="h-6 w-6 text-white" />}
            </Button>
          )}

          <Button
            onClick={endCall}
            size="lg"
            className="rounded-full h-14 w-14 p-0 bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
}