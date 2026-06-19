const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const similarity = (a, b, range) => clamp(100 - (Math.abs((a ?? 0) - (b ?? 0)) / range) * 100);

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

export function assessLicenseQuality(metrics = {}) {
  const flags = [];

  if ((metrics.brightness ?? 0) < 60) flags.push('too dark');
  if ((metrics.brightness ?? 255) > 220) flags.push('too bright');
  if ((metrics.contrast ?? 0) < 18) flags.push('low contrast');
  if ((metrics.sharpness ?? 0) < 10) flags.push('blurry');

  return {
    status: flags.length ? 'Review' : 'Pass',
    flags,
  };
}

export function calculateMatchConfidence({ license, before, after, biometricVerified }) {
  const liveConsistency = average([
    similarity(before.brightness, after.brightness, 80),
    similarity(before.contrast, after.contrast, 70),
    similarity(before.sharpness, after.sharpness, 45),
    similarity(before.faceCenterX, after.faceCenterX, 0.5),
    similarity(before.faceCenterY, after.faceCenterY, 0.5),
  ]);

  const documentMatch = average([
    similarity(license.brightness, average([before.brightness, after.brightness]), 90),
    similarity(license.contrast, average([before.contrast, after.contrast]), 70),
    similarity(license.sharpness, average([before.sharpness, after.sharpness]), 55),
    similarity(license.faceCenterX, average([before.faceCenterX, after.faceCenterX]), 0.5),
    similarity(license.faceCenterY, average([before.faceCenterY, after.faceCenterY]), 0.5),
  ]);

  const biometricScore = biometricVerified ? 100 : 25;
  const rawPercent = Math.round(clamp(liveConsistency * 0.35 + documentMatch * 0.45 + biometricScore * 0.2));
  const percent = biometricVerified ? rawPercent : Math.min(rawPercent, 74);

  let level = 'Low';
  if (!biometricVerified) level = 'Review';
  else if (percent >= 80) level = 'High';
  else if (percent >= 65) level = 'Medium';
  else if (percent >= 45) level = 'Review';

  return {
    percent,
    level,
    parts: {
      liveConsistency: Math.round(liveConsistency),
      documentMatch: Math.round(documentMatch),
      biometric: biometricVerified ? 'verified' : 'not verified',
    },
  };
}

export function summarizeResult({ match, licenseQuality }) {
  if (match.level === 'High' && licenseQuality.status === 'Pass') {
    return { action: 'Verified', message: 'High-confidence match and licence image passed basic quality checks.' };
  }

  if (match.percent >= 65 && licenseQuality.flags.length <= 1) {
    return { action: 'Human review', message: 'The result is plausible but should be reviewed before relying on it.' };
  }

  return { action: 'Do not rely', message: 'The check did not produce enough confidence for verification.' };
}
