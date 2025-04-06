import SimplePeer from 'simple-peer';
import { sendToWebsocket } from './websocket';

// Comprehensive polyfills for WebRTC and simple-peer
// These need to be loaded before any SimplePeer usage
if (typeof window !== 'undefined') {
  // Polyfill global
  if (!window.global) {
    (window as any).global = window;
  }
  
  // Polyfill process
  if (!window.process) {
    (window as any).process = { env: {} };
  }
  
  // Polyfill Buffer
  if (!window.Buffer) {
    (window as any).Buffer = {
      isBuffer: () => false
    };
  }
}

// Define call states
export enum CallState {
  IDLE = 'idle',
  CALLING = 'calling',
  RECEIVING = 'receiving',
  CONNECTED = 'connected',
  ENDED = 'ended'
}

// Define call types
export enum CallType {
  AUDIO = 'audio',
  VIDEO = 'video'
}

// Store active calls
type CallData = {
  peer: any; // SimplePeer instance
  stream: MediaStream | null;
  conversationId: number;
};

// Peer connections map (userId -> connection data)
const activeCalls = new Map<number, CallData>();

// Event listeners
type CallEventTypes = 
  | 'incoming-call' 
  | 'call-accepted' 
  | 'call-rejected' 
  | 'call-ended' 
  | 'call-connected' 
  | 'call-error';

type CallEventData = {
  type: CallEventTypes;
  from?: number;
  to?: number;
  callType?: CallType;
  error?: string;
  conversationId?: number;
};

const eventListeners = new Map<CallEventTypes, Array<(data: any) => void>>();

/**
 * Set up call signaling through WebSockets
 * @param userId Current user ID
 */
export function setupCallSignaling(userId: number) {
  // Store active calls per user ID
  if (!userId) {
    console.error('Cannot setup call signaling without user ID');
    return;
  }

  // Listen for WebSocket messages related to calls
  window.addEventListener('websocket-message', (event: any) => {
    const data = event.detail;
    
    // Only handle call-signal messages
    if (data.type !== 'call-signal') return;
    
    const { action, payload } = data;
    
    switch (action) {
      case 'call-request':
        // Incoming call
        handleIncomingCall(payload);
        break;
      
      case 'call-accept':
        // Call accepted
        handleCallAccepted(payload);
        break;
      
      case 'call-reject':
        // Call rejected
        handleCallRejected(payload);
        break;
      
      case 'call-end':
        // Call ended
        handleCallEnded(payload);
        break;
      
      case 'offer':
        // Received offer from peer
        handleSignalData(payload);
        break;
      
      case 'answer':
        // Received answer from peer
        handleSignalData(payload);
        break;
      
      case 'icecandidate':
        // Received ICE candidate from peer
        handleSignalData(payload);
        break;
    }
  });
}

/**
 * Add an event listener for call events
 * @param event Event type to listen for
 * @param callback Function to call when event occurs
 * @returns Function to remove the listener
 */
export function addEventListener(event: CallEventTypes, callback: (data: any) => void) {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, []);
  }
  
  const listeners = eventListeners.get(event)!;
  listeners.push(callback);
  
  // Return a function to remove this listener
  return () => {
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  };
}

/**
 * Trigger an event for all listeners
 * @param event Event type
 * @param data Data to pass to listeners
 */
function triggerEvent(event: CallEventTypes, data: any) {
  if (!eventListeners.has(event)) return;
  
  const listeners = eventListeners.get(event)!;
  for (const listener of listeners) {
    try {
      listener(data);
    } catch (error) {
      console.error('Error in call event listener:', error);
    }
  }
}

/**
 * Start a call to another user
 * @param targetUserId User ID to call
 * @param conversationId Conversation ID for this call
 * @param callType Type of call (audio or video)
 * @returns true if call was started, false otherwise
 */
export function startCall(targetUserId: number, conversationId: number, callType: CallType): boolean {
  try {
    // Get current user ID from session storage
    const currentUserId = Number(sessionStorage.getItem('userId'));
    
    if (!currentUserId || isNaN(currentUserId)) {
      console.error('Cannot start call without current user ID');
      return false;
    }
    
    // Check if we're already in a call with this user
    if (activeCalls.has(targetUserId)) {
      console.error('Already in a call with this user');
      triggerEvent('call-error', { error: 'Already in a call with this user' });
      return false;
    }
    
    // Send call request through WebSocket
    sendToWebsocket({
      type: 'call-signal',
      action: 'call-request',
      payload: {
        from: currentUserId,
        to: targetUserId,
        callType,
        conversationId
      }
    });
    
    // Store empty call data (will be populated when accepted)
    activeCalls.set(targetUserId, {
      peer: null,  // Will be set later
      stream: null,
      conversationId
    });
    
    return true;
  } catch (error) {
    console.error('Error starting call:', error);
    triggerEvent('call-error', { error: 'Could not start call: ' + (error as Error).message });
    return false;
  }
}

/**
 * Accept an incoming call
 * @param fromUserId User ID who called
 * @param callType Type of call to accept
 * @param localStream Local media stream to use
 */
export function acceptCall(fromUserId: number, callType: CallType, localStream: MediaStream) {
  try {
    // Get current user ID from session storage
    const currentUserId = Number(sessionStorage.getItem('userId'));
    
    if (!currentUserId || isNaN(currentUserId)) {
      console.error('Cannot accept call without current user ID');
      return;
    }
    
    // Check if we have an incoming call from this user
    if (!activeCalls.has(fromUserId)) {
      console.error('No incoming call from this user');
      return;
    }
    
    const callData = activeCalls.get(fromUserId)!;
    
    // Send call accept through WebSocket
    sendToWebsocket({
      type: 'call-signal',
      action: 'call-accept',
      payload: {
        from: currentUserId,
        to: fromUserId,
        callType,
        conversationId: callData.conversationId
      }
    });
    
    // Create peer connection as non-initiator
    const peer = new SimplePeer({
      initiator: false,
      trickle: true,
      streams: [localStream]
    });
    
    // Set up peer event handlers
    setupPeerEvents(peer, fromUserId, localStream);
    
    // Update call data
    activeCalls.set(fromUserId, {
      ...callData,
      peer,
      stream: localStream
    });
  } catch (error) {
    console.error('Error accepting call:', error);
    triggerEvent('call-error', { error: 'Could not accept call: ' + (error as Error).message });
  }
}

/**
 * Reject an incoming call
 * @param fromUserId User ID who called
 */
export function rejectCall(fromUserId: number) {
  try {
    // Get current user ID from session storage
    const currentUserId = Number(sessionStorage.getItem('userId'));
    
    if (!currentUserId || isNaN(currentUserId)) {
      console.error('Cannot reject call without current user ID');
      return;
    }
    
    // Check if we have an incoming call from this user
    if (!activeCalls.has(fromUserId)) {
      console.error('No incoming call from this user');
      return;
    }
    
    const callData = activeCalls.get(fromUserId)!;
    
    // Send call reject through WebSocket
    sendToWebsocket({
      type: 'call-signal',
      action: 'call-reject',
      payload: {
        from: currentUserId,
        to: fromUserId,
        conversationId: callData.conversationId
      }
    });
    
    // Clean up call data
    if (callData.peer) {
      callData.peer.destroy();
    }
    
    activeCalls.delete(fromUserId);
  } catch (error) {
    console.error('Error rejecting call:', error);
  }
}

/**
 * End an active call
 * @param otherUserId User ID of the other party
 */
export function endCall(otherUserId: number) {
  try {
    // Get current user ID from session storage
    const currentUserId = Number(sessionStorage.getItem('userId'));
    
    if (!currentUserId || isNaN(currentUserId)) {
      console.error('Cannot end call without current user ID');
      return;
    }
    
    // Check if we're in a call with this user
    if (!activeCalls.has(otherUserId)) {
      console.error('No active call with this user');
      return;
    }
    
    const callData = activeCalls.get(otherUserId)!;
    
    // Send call end through WebSocket
    sendToWebsocket({
      type: 'call-signal',
      action: 'call-end',
      payload: {
        from: currentUserId,
        to: otherUserId,
        conversationId: callData.conversationId
      }
    });
    
    // Clean up call data
    if (callData.peer) {
      callData.peer.destroy();
    }
    
    // Clean up local stream
    if (callData.stream) {
      callData.stream.getTracks().forEach(track => track.stop());
    }
    
    activeCalls.delete(otherUserId);
  } catch (error) {
    console.error('Error ending call:', error);
  }
}

/**
 * Handle an incoming call
 * @param data Call request data
 */
function handleIncomingCall(data: any) {
  const { from, callType, conversationId } = data;
  
  // Store incoming call data
  activeCalls.set(from, {
    peer: null,  // Will be set when accepted
    stream: null,
    conversationId
  });
  
  // Trigger incoming call event
  triggerEvent('incoming-call', { 
    from, 
    callType,
    conversationId
  });
}

/**
 * Handle call accepted response
 * @param data Call accepted data
 */
function handleCallAccepted(data: any) {
  const { from, to, callType, conversationId } = data;
  
  // Get current user ID from session storage
  const currentUserId = Number(sessionStorage.getItem('userId'));
  
  // Only handle if we're the caller
  if (to !== currentUserId) return;
  
  // Check if we have a pending call to this user
  if (!activeCalls.has(from)) {
    console.error('No pending call to this user');
    return;
  }
  
  // Trigger call accepted event
  triggerEvent('call-accepted', { 
    from, 
    callType,
    conversationId
  });
  
  // Request media
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: callType === CallType.VIDEO
  }).then(stream => {
    // Create peer as initiator
    const peer = new SimplePeer({
      initiator: true,
      trickle: true,
      streams: [stream]
    });
    
    // Set up peer events
    setupPeerEvents(peer, from, stream);
    
    // Update call data
    const callData = activeCalls.get(from)!;
    activeCalls.set(from, {
      ...callData,
      peer,
      stream
    });
  }).catch(error => {
    console.error('Error getting media:', error);
    triggerEvent('call-error', { error: 'Could not access media devices: ' + error.message });
    
    // End the call
    endCall(from);
  });
}

/**
 * Handle call rejected response
 * @param data Call rejected data
 */
function handleCallRejected(data: any) {
  const { from, to } = data;
  
  // Get current user ID from session storage
  const currentUserId = Number(sessionStorage.getItem('userId'));
  
  // Only handle if we're the caller
  if (to !== currentUserId) return;
  
  // Check if we have a pending call to this user
  if (!activeCalls.has(from)) {
    console.error('No pending call to this user');
    return;
  }
  
  // Trigger call rejected event
  triggerEvent('call-rejected', { from });
  
  // Clean up call data
  const callData = activeCalls.get(from)!;
  if (callData.peer) {
    callData.peer.destroy();
  }
  
  // Clean up local stream
  if (callData.stream) {
    callData.stream.getTracks().forEach(track => track.stop());
  }
  
  activeCalls.delete(from);
}

/**
 * Handle call ended response
 * @param data Call ended data
 */
function handleCallEnded(data: any) {
  const { from, to } = data;
  
  // Get current user ID from session storage
  const currentUserId = Number(sessionStorage.getItem('userId'));
  
  // Only handle if we're the call recipient
  if (to !== currentUserId) return;
  
  // Check if we have an active call with this user
  if (!activeCalls.has(from)) {
    console.error('No active call with this user');
    return;
  }
  
  // Trigger call ended event
  triggerEvent('call-ended', { from });
  
  // Clean up call data
  const callData = activeCalls.get(from)!;
  if (callData.peer) {
    callData.peer.destroy();
  }
  
  // Clean up local stream
  if (callData.stream) {
    callData.stream.getTracks().forEach(track => track.stop());
  }
  
  activeCalls.delete(from);
}

/**
 * Handle WebRTC signaling data
 * @param data Signal data
 */
function handleSignalData(data: any) {
  const { from, to, signal } = data;
  
  // Get current user ID from session storage
  const currentUserId = Number(sessionStorage.getItem('userId'));
  
  // Only handle signals directed to us
  if (to !== currentUserId) return;
  
  // Check if we have an active call with this user
  if (!activeCalls.has(from)) {
    console.error('No active call with this user');
    return;
  }
  
  const callData = activeCalls.get(from)!;
  
  // Pass signal to peer connection
  if (callData.peer) {
    callData.peer.signal(signal);
  }
}

/**
 * Set up events for a peer connection
 * @param peer SimplePeer instance
 * @param otherUserId ID of the other user
 * @param localStream Local media stream
 */
function setupPeerEvents(peer: any, otherUserId: number, localStream: MediaStream) {
  // Get current user ID
  const currentUserId = Number(sessionStorage.getItem('userId'));
  
  // Handle signaling data
  peer.on('signal', (data: any) => {
    // Choose action based on signal type
    let action = 'offer';
    if (data.type === 'answer') {
      action = 'answer';
    } else if (data.candidate) {
      action = 'icecandidate';
    }
    
    // Send signal to the other peer
    sendToWebsocket({
      type: 'call-signal',
      action,
      payload: {
        from: currentUserId,
        to: otherUserId,
        signal: data
      }
    });
  });
  
  // Handle connection established
  peer.on('connect', () => {
    console.log('Peer connection established');
    triggerEvent('call-connected', { with: otherUserId });
  });
  
  // Handle remote stream
  peer.on('stream', (stream: MediaStream) => {
    console.log('Received remote stream:', stream);
    
    // Create a new audio or video element to play the remote stream
    const remoteStream = stream;
    
    // Find remote video elements by their ref attribute
    const remoteVideos = document.querySelectorAll('video[data-ref="remote-video"]');
    if (remoteVideos.length > 0) {
      console.log('Found remote video elements:', remoteVideos.length);
      
      // Convert NodeList to Array to avoid type errors
      Array.from(remoteVideos).forEach((element) => {
        // Type cast to HTMLVideoElement
        const videoElement = element as HTMLVideoElement;
        if (videoElement && videoElement instanceof HTMLVideoElement) {
          console.log('Setting remote stream on video element');
          videoElement.srcObject = remoteStream;
          
          // Ensure playback starts
          videoElement.play().catch(err => {
            console.error('Error playing remote stream:', err);
          });
        }
      });
    } else {
      console.warn('No remote video elements found with data-ref="remote-video"');
    }
    
    // Also look for the legacy ID-based element for backward compatibility
    const remoteVideoById = document.getElementById('remote-video') as HTMLVideoElement;
    if (remoteVideoById) {
      console.log('Found remote video by ID');
      remoteVideoById.srcObject = remoteStream;
      remoteVideoById.play().catch(err => {
        console.error('Error playing remote stream (ID method):', err);
      });
    }
    
    // Trigger stream event for UI to handle
    const event = new CustomEvent('webrtc-remote-stream', { 
      detail: { stream: remoteStream, from: otherUserId }
    });
    window.dispatchEvent(event);
  });
  
  // Handle peer errors
  peer.on('error', (err: any) => {
    console.error('Peer connection error:', err);
    triggerEvent('call-error', { error: err.message, with: otherUserId });
    
    // Clean up on error
    cleanupCall(otherUserId);
  });
  
  // Handle peer close
  peer.on('close', () => {
    console.log('Peer connection closed');
    
    // Clean up on close
    cleanupCall(otherUserId);
  });
}

/**
 * Clean up a call
 * @param otherUserId ID of the other user
 */
function cleanupCall(otherUserId: number) {
  // Check if we have an active call
  if (!activeCalls.has(otherUserId)) return;
  
  const callData = activeCalls.get(otherUserId)!;
  
  // Stop all tracks in the stream
  if (callData.stream) {
    callData.stream.getTracks().forEach(track => track.stop());
  }
  
  // Delete call data
  activeCalls.delete(otherUserId);
}