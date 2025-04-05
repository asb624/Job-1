import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../hooks/use-auth';
import { useToast } from '../../hooks/use-toast';

type CallState = 'idle' | 'calling' | 'receiving' | 'ongoing';
type CallType = 'audio' | 'video';

interface CallContextType {
  callState: CallState;
  callType: CallType | null;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  incomingCall: {
    from: {
      userId: number;
      username: string;
    };
    callType: CallType;
  } | null;
  startCall: (userId: number, username: string, type: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  endCall: () => void;
  rejectCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

interface CallProviderProps {
  children: ReactNode;
}

export function CallProvider({ children }: CallProviderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    from: {
      userId: number;
      username: string;
    };
    callType: CallType;
  } | null>(null);
  const [currentCallInfo, setCurrentCallInfo] = useState<{
    userId: number;
    username: string;
  } | null>(null);
  
  const peerRef = useRef<Peer.Instance | null>(null);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    // Check if call features are enabled by the feature flag system
    const featureFlags = (window as any).__featureFlags || {};
    if (!featureFlags.enableCallFeature) {
      console.log('Call features are currently disabled by feature flags');
      return;
    }

    console.log('Initializing socket for call functionality');
    
    // Create a Socket.IO connection for WebRTC signaling
    const protocol = window.location.protocol.includes('https') ? 'https' : 'http';
    const host = window.location.host;
    const url = `${protocol}://${host}`;
    
    console.log('Connecting to Socket.IO at:', url);
    
    const newSocket = io(url, {
      path: '/socket.io',
      query: {
        userId: user.id.toString()
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected for calling:', newSocket.id);
      toast({
        title: 'Call system ready',
        description: 'You can now make and receive calls',
      });
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      toast({
        title: 'Connection issue',
        description: 'Could not connect to call system',
        variant: 'destructive'
      });
    });

    newSocket.on('call-incoming', ({ from, callType }) => {
      console.log('Incoming call from', from);
      setIncomingCall({
        from,
        callType
      });
      setCallState('receiving');
      setCallType(callType);
    });

    newSocket.on('call-rejected', () => {
      toast({
        title: 'Call rejected',
        description: 'The other user rejected your call',
      });
      cleanupCall();
    });

    newSocket.on('call-accepted', async ({ signal }) => {
      try {
        if (peerRef.current) {
          console.log('Received call acceptance signal, applying to peer');
          peerRef.current.signal(signal);
          setCallState('ongoing');
        }
      } catch (error) {
        console.error('Error accepting call:', error);
        cleanupCall();
      }
    });

    newSocket.on('peer-signal', ({ signal }) => {
      try {
        if (peerRef.current) {
          console.log('Received peer signal, applying to peer');
          peerRef.current.signal(signal);
        }
      } catch (error) {
        console.error('Error signaling peer:', error);
      }
    });

    newSocket.on('call-ended', () => {
      toast({
        title: 'Call ended',
        description: 'The call has been ended',
      });
      cleanupCall();
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // The server has forcefully disconnected the socket
        toast({
          title: 'Disconnected',
          description: 'Server disconnected the call session',
          variant: 'destructive'
        });
      } else if (reason === 'transport close') {
        // The connection was closed (e.g., user lost internet)
        if (callState !== 'idle') {
          toast({
            title: 'Connection lost',
            description: 'Call ended due to connection issue',
            variant: 'destructive'
          });
          cleanupCall();
        }
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up Socket.IO connection');
      if (newSocket) {
        newSocket.disconnect();
      }
      cleanupCall();
    };
  }, [user]);

  const cleanupCall = () => {
    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Clean up peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    // Reset states
    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCallType(null);
    setIncomingCall(null);
    setCurrentCallInfo(null);
  };

  const startCall = async (userId: number, username: string, type: CallType) => {
    if (!socket || !user) {
      toast({
        title: 'Call failed',
        description: 'Could not establish connection',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Get user media based on call type
      const constraints = {
        audio: true,
        video: type === 'video' ? { width: 640, height: 480 } : false
      };

      console.log(`Starting ${type} call to user ${userId} (${username})`);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setCallState('calling');
      setCallType(type);
      setCurrentCallInfo({ userId, username });

      // Create peer
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      // Handle peer events
      peer.on('signal', (data: any) => {
        console.log('Sending initial call signal');
        socket.emit('call-user', {
          to: userId,
          signal: data,
          from: {
            userId: user.id,
            username: user.username
          },
          callType: type
        });
      });

      peer.on('stream', (remoteMediaStream: MediaStream) => {
        console.log('Received remote stream');
        setRemoteStream(remoteMediaStream);
        setCallState('ongoing');
      });

      peer.on('error', (err: Error) => {
        console.error('Peer error:', err);
        toast({
          title: 'Call error',
          description: 'Could not establish connection',
          variant: 'destructive'
        });
        cleanupCall();
      });

      peerRef.current = peer;
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: 'Media error',
        description: 'Could not access camera or microphone',
        variant: 'destructive'
      });
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!socket || !incomingCall) return;

    try {
      // Get user media based on incoming call type
      const constraints = {
        audio: true,
        video: incomingCall.callType === 'video' ? { width: 640, height: 480 } : false
      };

      console.log(`Answering ${incomingCall.callType} call from user ${incomingCall.from.userId}`);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      setCurrentCallInfo(incomingCall.from);

      // Create peer
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
      });

      // Handle peer events
      peer.on('signal', (data: any) => {
        console.log('Sending answer signal');
        socket.emit('call-answer', {
          to: incomingCall.from.userId,
          signal: data,
          from: user?.id
        });
      });

      peer.on('stream', (remoteMediaStream: MediaStream) => {
        console.log('Received remote stream');
        setRemoteStream(remoteMediaStream);
        setCallState('ongoing');
      });

      peer.on('error', (err: Error) => {
        console.error('Peer error:', err);
        toast({
          title: 'Call error',
          description: 'Could not establish connection',
          variant: 'destructive'
        });
        cleanupCall();
      });

      peerRef.current = peer;
    } catch (error) {
      console.error('Error answering call:', error);
      toast({
        title: 'Media error',
        description: 'Could not access camera or microphone',
        variant: 'destructive'
      });
      cleanupCall();
    }
  };

  const endCall = () => {
    if (socket && currentCallInfo) {
      console.log(`Ending call with user ${currentCallInfo.userId}`);
      socket.emit('call-end', {
        to: currentCallInfo.userId
      });
    }
    cleanupCall();
  };

  const rejectCall = () => {
    if (socket && incomingCall) {
      console.log(`Rejecting call from user ${incomingCall.from.userId}`);
      socket.emit('call-reject', {
        to: incomingCall.from.userId
      });
    }
    cleanupCall();
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        remoteStream,
        localStream,
        incomingCall,
        startCall,
        answerCall,
        endCall,
        rejectCall
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (context === undefined) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}