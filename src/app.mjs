import { assessLicenseQuality, calculateMatchConfidence, summarizeResult } from './scoring.mjs';

const $ = (selector) => document.querySelector(selector);

const state = {
  stream: null,
  license: null,
  before: null,
  after: null,
  biometricVerified: false,
};

const video = $('#camera');
const canvas = $('#captureCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

function setStatus(message) {
  $('#status').textContent = message;
}

function enable(id, enabled = true) {
  $(id).disabled = !enabled;
}

async function startCamera() {
  state.stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = state.stream;
  await video.play();
  enable('#captureLicense');
  setStatus('Camera ready. Photograph the driver’s licence first.');
}

function captureFrame(label) {
  canvas.width = video.videoWidth || 960;
  canvas.height = video.videoHeight || 540;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const metrics = imageMetrics(imageData);
  addThumb(label, dataUrl, metrics);
  return metrics;
}

function imageMetrics(imageData) {
  const data = imageData.data;
  let sum = 0;
  let min = 255;
  let max = 0;
  let edge = 0;
  let weightedX = 0;
  let weightedY = 0;
  let weight = 0;
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4;
      const lum = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
      sum += lum;
      min = Math.min(min, lum);
      max = Math.max(max, lum);
      const right = Math.min(i + 16, data.length - 4);
      const diff = Math.abs(lum - (data[right] * 0.2126 + data[right + 1] * 0.7152 + data[right + 2] * 0.0722));
      edge += diff;
      if (lum > 85 && lum < 230) {
        const w = 255 - Math.abs(150 - lum);
        weightedX += x * w;
        weightedY += y * w;
        weight += w;
      }
    }
  }

  const samples = Math.ceil(width / 4) * Math.ceil(height / 4);
  return {
    brightness: Math.round(sum / samples),
    contrast: Math.round(max - min),
    sharpness: Math.round(edge / samples),
    faceCenterX: Number((weight ? weightedX / weight / width : 0.5).toFixed(3)),
    faceCenterY: Number((weight ? weightedY / weight / height : 0.5).toFixed(3)),
  };
}

function addThumb(label, src, metrics) {
  const item = document.createElement('figure');
  item.innerHTML = `<img src="${src}" alt="${label} capture"><figcaption>${label}<br><span>${metrics.brightness} bright · ${metrics.contrast} contrast · ${metrics.sharpness} sharp</span></figcaption>`;
  $('#captures').appendChild(item);
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function withTimeout(promise, milliseconds, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), milliseconds)),
  ]);
}

async function triggerPlatformBiometric() {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    throw new Error('This browser does not expose the platform biometric prompt to web apps.');
  }

  if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) {
      throw new Error('No Face ID / Android biometric authenticator is available to this browser.');
    }
  }

  // Proof-of-concept only: creating a throwaway platform credential is the most reliable
  // browser API path for visibly kicking the native Face ID / Android biometric sheet.
  return navigator.credentials.create({
    publicKey: {
      challenge: randomBytes(32),
      rp: { name: 'FaceIQ Demo' },
      user: {
        id: randomBytes(16),
        name: `faceiq-demo-${Date.now()}@local`,
        displayName: 'FaceIQ demo user',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged',
      },
      attestation: 'none',
      timeout: 15000,
    },
  });
}

async function runBiometricCheck() {
  setStatus('1/3 Capturing BEFORE photo now…');
  state.before = captureFrame('Before biometric');

  try {
    setStatus('2/3 Face ID / Android biometric prompt should appear now. Approve it on this device.');
    await withTimeout(triggerPlatformBiometric(), 18000, 'Biometric prompt timed out or was dismissed.');
    state.biometricVerified = true;
  } catch (error) {
    state.biometricVerified = false;
    console.warn('Biometric check was not verified in this proof-of-concept:', error.message);
    setStatus(`2/3 Biometric was not verified: ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, 900));
  }

  setStatus('3/3 Capturing AFTER photo now…');
  state.after = captureFrame('After biometric');
  enable('#runCheck');
  enable('#showResult');
  setStatus(state.biometricVerified ? 'Face ID / Android biometric verified. Ready to calculate confidence.' : 'Biometric not verified. You can still show the capped review result, or rerun the biometric check.');
}

function showResult() {
  const licenseQuality = assessLicenseQuality(state.license);
  const match = calculateMatchConfidence({
    license: state.license,
    before: state.before,
    after: state.after,
    biometricVerified: state.biometricVerified,
  });
  const summary = summarizeResult({ match, licenseQuality });

  $('#result').hidden = false;
  $('#confidence').textContent = `${match.percent}%`;
  $('#level').textContent = match.level;
  $('#decision').textContent = summary.action;
  $('#message').textContent = summary.message;
  $('#licenseFlags').textContent = licenseQuality.flags.length ? licenseQuality.flags.join(', ') : 'No obvious quality/fake-image flags in this demo check.';
  $('#parts').innerHTML = `
    <li>Live before/after consistency: ${match.parts.liveConsistency}%</li>
    <li>Licence-to-live image similarity: ${match.parts.documentMatch}%</li>
    <li>Native biometric check: ${match.parts.biometric}</li>
  `;
}

$('#startCamera').addEventListener('click', async () => {
  try {
    await startCamera();
  } catch (error) {
    setStatus(`Camera failed: ${error.message}`);
  }
});

$('#captureLicense').addEventListener('click', () => {
  state.license = captureFrame('Driver’s licence');
  enable('#runCheck');
  setStatus('Licence captured. Hold the phone normally and run the two-second biometric check.');
});

$('#runCheck').addEventListener('click', async () => {
  enable('#runCheck', false);
  enable('#showResult', false);
  setStatus('Starting: before photo → Face ID / Android biometric prompt → after photo. Watch for the native biometric sheet.');
  await runBiometricCheck();
});

$('#showResult').addEventListener('click', showResult);
