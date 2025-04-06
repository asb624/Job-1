// A simple Node.js script to generate a ringtone
// This script uses the AudioContext API to generate a simple ringtone

import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file and directory name (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to create ringtone using ffmpeg
function createRingtone() {
  const outputPath = path.resolve(__dirname, '../public/sounds/ringtone.mp3');
  
  // Create a simple ringtone using ffmpeg
  // This generates a 3-second ringtone with two alternating tones
  const command = `
    ffmpeg -y -f lavfi -i "sine=frequency=1000:duration=0.3,sine=frequency=800:duration=0.3,sine=frequency=1000:duration=0.3,sine=frequency=800:duration=0.3,sine=frequency=1000:duration=0.3,sine=frequency=800:duration=0.3,sine=frequency=1000:duration=0.3,sine=frequency=800:duration=0.3,sine=frequency=1000:duration=0.3,sine=frequency=800:duration=0.3:amplitude=0.5" -c:a libmp3lame -b:a 128k "${outputPath}"
  `;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error generating ringtone: ${error.message}`);
      
      // Fallback to creating a silent audio file if ffmpeg fails
      createSilentFallback(outputPath);
      return;
    }
    
    console.log(`Ringtone generated successfully at ${outputPath}`);
  });
}

// Create a silent fallback file if ffmpeg isn't available
function createSilentFallback(outputPath) {
  console.log('Creating silent fallback ringtone...');
  
  // Create an empty MP3 file (1 second silent)
  const emptyMp3 = Buffer.from([
    0xFF, 0xE3, 0x18, 0xC4, 0x00, 0x00, 0x00, 0x03, 0x48, 0x00, 0x00, 0x00, 0x00,
    0x4C, 0x41, 0x4D, 0x45, 0x33, 0x2E, 0x31, 0x30, 0x30, 0x55, 0x55, 0x55, 0x55,
    0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55, 0x55
  ]);
  
  try {
    fs.writeFileSync(outputPath, emptyMp3);
    console.log(`Silent fallback ringtone created at ${outputPath}`);
  } catch (err) {
    console.error(`Failed to create fallback ringtone: ${err.message}`);
  }
}

// Start generating the ringtone
createRingtone();