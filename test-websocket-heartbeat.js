// Simple WebSocket test client with heartbeat support
import { WebSocket } from 'ws';

// Create a WebSocket connection
const socket = new WebSocket('ws://localhost:5000/ws');
let pingInterval;
let connectionAlive = true;
let heartbeatMissed = 0;
const maxHeartbeatMisses = 3;
const pingFrequency = 5000; // 5 seconds (reduced for testing)
let testDuration = 30000; // Run test for 30 seconds

// Connection opened
socket.addEventListener('open', (event) => {
  console.log('WebSocket connection established');
  
  // Send an authentication message
  const userId = 1; // Assuming user ID 1 exists
  socket.send(JSON.stringify({
    type: 'auth',
    action: 'identify',
    payload: { userId }
  }));
  
  // Start sending heartbeat pings
  pingInterval = setInterval(() => {
    if (connectionAlive) {
      console.log('Sending ping...');
      socket.send(JSON.stringify({
        type: 'connection',
        status: 'ping',
        timestamp: new Date().toISOString()
      }));
      
      // If we don't get a pong within 5 seconds, consider it missed
      setTimeout(() => {
        if (connectionAlive) {
          heartbeatMissed++;
          console.log(`Heartbeat missed (${heartbeatMissed}/${maxHeartbeatMisses})`);
          
          if (heartbeatMissed >= maxHeartbeatMisses) {
            console.error('Maximum heartbeat misses reached, closing connection');
            clearInterval(pingInterval);
            socket.close();
          }
        }
      }, 5000);
    }
  }, pingFrequency);
});

// Listen for messages
socket.addEventListener('message', (event) => {
  try {
    const message = JSON.parse(event.data);
    console.log('Message received:', message);
    
    // Reset heartbeat counter on any received message
    heartbeatMissed = 0;
    
    // If we receive a pong, log it specifically
    if (message.type === 'connection' && message.status === 'pong') {
      console.log('✓ Heartbeat pong received');
    }
    
  } catch (error) {
    console.error('Error parsing message:', error);
  }
});

// Connection closed
socket.addEventListener('close', (event) => {
  console.log(`WebSocket closed (code: ${event.code}, reason: ${event.reason || 'none'})`);
  connectionAlive = false;
  clearInterval(pingInterval);
});

// Connection error
socket.addEventListener('error', (error) => {
  console.error('WebSocket error:', error);
  connectionAlive = false;
  clearInterval(pingInterval);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Closing WebSocket connection...');
  socket.close();
  process.exit(0);
});

console.log('WebSocket test client started. Will run for 30 seconds.');

// Close the connection after test duration
setTimeout(() => {
  console.log('Test completed, closing connection...');
  socket.close();
  process.exit(0);
}, testDuration);