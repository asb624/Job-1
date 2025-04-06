import WebSocket from 'ws';
import fs from 'fs';

// Read cookie from file
const cookieContent = fs.readFileSync('./cookie.txt', 'utf8');
const cookieLine = cookieContent.split('\n').find(line => line.includes('job_bazaar_session'));
const cookieParts = cookieLine.split(/\s+/);
const cookieValue = `${cookieParts[5]}=${cookieParts[6]}`;

// Create WebSocket connection
const ws = new WebSocket('ws://localhost:5000/ws?userId=11', {
  headers: {
    Cookie: cookieValue
  }
});

ws.on('open', function open() {
  console.log('WebSocket connection established');
  
  // Send authentication message
  ws.send(JSON.stringify({
    type: 'auth',
    action: 'identify',
    payload: { userId: 11 }
  }));
  
  // Send test message
  setTimeout(() => {
    console.log('Sending test message');
    ws.send(JSON.stringify({
      type: 'message',
      action: 'create',
      payload: { text: 'Test message from WebSocket client' }
    }));
  }, 1000);
});

ws.on('message', function incoming(data) {
  console.log('Message received:', data.toString());
});

ws.on('error', function error(err) {
  console.error('WebSocket error:', err);
});

ws.on('close', function close(code, reason) {
  console.log(`WebSocket closed with code: ${code}, reason: ${reason}`);
});

// Test reconnection
setTimeout(() => {
  console.log('Testing reconnection - Closing WebSocket connection intentionally');
  ws.close();
  
  setTimeout(() => {
    console.log('Attempting to reconnect...');
    const newWs = new WebSocket('ws://localhost:5000/ws?userId=11', {
      headers: {
        Cookie: cookieValue
      }
    });
    
    newWs.on('open', function open() {
      console.log('Reconnection successful');
      
      // Send authentication message on reconnect
      newWs.send(JSON.stringify({
        type: 'auth',
        action: 'identify',
        payload: { userId: 11 }
      }));
    });
    
    newWs.on('message', function incoming(data) {
      console.log('Message received after reconnect:', data.toString());
    });
    
    newWs.on('error', function error(err) {
      console.error('Reconnection WebSocket error:', err);
    });
    
    newWs.on('close', function close(code, reason) {
      console.log(`Reconnection WebSocket closed with code: ${code}, reason: ${reason}`);
      process.exit(0);
    });
    
    // Close after a bit
    setTimeout(() => {
      console.log('Test complete - Closing final connection');
      newWs.close();
    }, 2000);
    
  }, 1000);
  
}, 2000);