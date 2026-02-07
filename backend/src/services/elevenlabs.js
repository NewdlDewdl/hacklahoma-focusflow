const https = require('https');

const ELEVENLABS_API = 'https://api.elevenlabs.io/v1';
// Rachel voice — warm, encouraging coach vibe
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

let apiKey = null;

function initElevenLabs() {
  apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  ELEVENLABS_API_KEY missing. Voice nudges disabled.');
    return false;
  }
  console.log('🎙️  ElevenLabs TTS ready');
  return true;
}

/**
 * Generate speech audio from text.
 * Returns a Buffer of mp3 audio, or null on failure.
 */
async function generateSpeech(text, voiceId = DEFAULT_VOICE_ID) {
  if (!apiKey) return null;

  try {
    const response = await fetch(`${ELEVENLABS_API}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2', // fastest model for real-time nudges
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3, // slight coaching energy
        },
      }),
    });

    if (!response.ok) {
      console.error('ElevenLabs error:', response.status, await response.text());
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error('ElevenLabs TTS failed:', err.message);
    return null;
  }
}

/**
 * Generate speech and return as base64 data URI for frontend playback.
 * This avoids needing to serve audio files.
 */
async function generateSpeechBase64(text, voiceId = DEFAULT_VOICE_ID) {
  const buffer = await generateSpeech(text, voiceId);
  if (!buffer) return null;
  return `data:audio/mpeg;base64,${buffer.toString('base64')}`;
}

module.exports = { initElevenLabs, generateSpeech, generateSpeechBase64 };
