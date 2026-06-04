import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMatchConfidence,
  assessLicenseQuality,
  summarizeResult,
} from '../src/scoring.mjs';

test('calculateMatchConfidence rewards similar live captures and document face', () => {
  const score = calculateMatchConfidence({
    license: { brightness: 120, contrast: 45, sharpness: 28, faceCenterX: 0.5, faceCenterY: 0.5 },
    before: { brightness: 123, contrast: 43, sharpness: 27, faceCenterX: 0.52, faceCenterY: 0.49 },
    after: { brightness: 118, contrast: 46, sharpness: 30, faceCenterX: 0.49, faceCenterY: 0.51 },
    biometricVerified: true,
  });

  assert.equal(score.level, 'High');
  assert.ok(score.percent >= 80);
});

test('calculateMatchConfidence penalizes missing biometric verification', () => {
  const score = calculateMatchConfidence({
    license: { brightness: 120, contrast: 45, sharpness: 28, faceCenterX: 0.5, faceCenterY: 0.5 },
    before: { brightness: 123, contrast: 43, sharpness: 27, faceCenterX: 0.52, faceCenterY: 0.49 },
    after: { brightness: 118, contrast: 46, sharpness: 30, faceCenterX: 0.49, faceCenterY: 0.51 },
    biometricVerified: false,
  });

  assert.equal(score.level, 'Review');
  assert.ok(score.percent < 75);
});

test('assessLicenseQuality flags blurry or poorly lit licence images', () => {
  const assessment = assessLicenseQuality({ brightness: 35, contrast: 8, sharpness: 4 });

  assert.equal(assessment.status, 'Review');
  assert.ok(assessment.flags.includes('too dark'));
  assert.ok(assessment.flags.includes('low contrast'));
  assert.ok(assessment.flags.includes('blurry'));
});

test('summarizeResult combines match and licence quality into next action', () => {
  const summary = summarizeResult({
    match: { percent: 88, level: 'High' },
    licenseQuality: { status: 'Pass', flags: [] },
  });

  assert.equal(summary.action, 'Verified');
});
