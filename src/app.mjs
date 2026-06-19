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

function showScreen(name) {
  document.querySelectorAll('.screen').forEach((screen) => {
    screen.classList.toggle('active', screen.dataset.screen === name);
  });
}

function setBusy(button, busy, label) {
  button.disabled = busy;
  if (label) button.textContent = label;
}

async function startCamera() {
  if (state.stream) return;
  state.stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = state.stream;
  await video.play();
}

function captureFrame() {
  canvas.width = video.videoWidth || 960;
  canvas.height = video.videoHeight || 540;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return imageMetrics(ctx.getImageData(0, 0, canvas.width, canvas.height));
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

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function startCountdown(seconds) {
  const countdown = $('#countdown');
  const started = performance.now();
  const tick = () => {
    const elapsed = (performance.now() - started) / 1000;
    const remaining = Math.max(0, seconds - elapsed);
    countdown.textContent = remaining.toFixed(1);
    if (remaining > 0) requestAnimationFrame(tick);
  };
  tick();
}

async function triggerPlatformBiometric() {
  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    throw new Error('Platform biometric prompt unavailable.');
  }

  if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) throw new Error('No platform biometric available.');
  }

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

async function runFaceCheck() {
  const button = $('#runBiometric');
  setBusy(button, true, 'Checking…');
  state.before = captureFrame();
  state.biometricVerified = false;
  startCountdown(2.0);

  const biometricAttempt = triggerPlatformBiometric()
    .then(() => { state.biometricVerified = true; })
    .catch((error) => console.warn('Biometric prompt not confirmed:', error.message));

  await sleep(2200);
  state.after = captureFrame();
  await Promise.race([biometricAttempt, sleep(300)]);
  renderResult();
  setBusy(button, false, 'Run face check');
  showScreen('result');
}

function renderResult() {
  const licenseQuality = assessLicenseQuality(state.license);
  const match = calculateMatchConfidence({
    license: state.license,
    before: state.before,
    after: state.after,
    biometricVerified: state.biometricVerified,
  });
  const summary = summarizeResult({ match, licenseQuality });
  const verified = summary.action === 'Verified';

  $('#resultTitle').textContent = verified ? 'Verified' : 'Could not verify';
  $('#resultCopy').textContent = verified
    ? 'The licence, live face and phone biometric lined up.'
    : 'The check did not produce enough confidence. Try again with better light and a clear licence photo.';
}

function resetDemo() {
  state.license = null;
  state.before = null;
  state.after = null;
  state.biometricVerified = false;
  $('#countdown').textContent = '2.0';
  showScreen('start');
}

$('#startDemo').addEventListener('click', async () => {
  const button = $('#startDemo');
  try {
    setBusy(button, true, 'Opening camera…');
    await startCamera();
    showScreen('license');
  } catch (error) {
    button.textContent = 'Camera blocked — try again';
    console.error(error);
  } finally {
    button.disabled = false;
  }
});

$('#captureLicense').addEventListener('click', () => {
  state.license = captureFrame();
  showScreen('biometric');
});

$('#runBiometric').addEventListener('click', runFaceCheck);
$('#resetDemo').addEventListener('click', resetDemo);
$('#detailsToggle').addEventListener('click', () => { $('#details').hidden = false; });
$('#detailsClose').addEventListener('click', () => { $('#details').hidden = true; });
