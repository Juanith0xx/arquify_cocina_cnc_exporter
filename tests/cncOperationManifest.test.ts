import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCncOperationManifest
} from '../src/services/cncOperationManifest.js';

import type {
  CncMachinedPart
} from '../src/utils/kitchenCncMachining.js';

const part: CncMachinedPart = {
  partCode: 'TEST-001',
  partName: 'Lateral de prueba',
  moduleTag: 'B-1',
  moduleName: 'BASE',
  width: 562,
  length: 800,
  thickness: 18,
  material: '#FFFFFF',
  grainDirection: 'vertical',
  edgeL1: false,
  edgeL2: false,
  edgeW1: false,
  edgeW2: false,
  edgeThicknessL1: 0,
  edgeThicknessL2: 0,
  edgeThicknessW1: 0,
  edgeThicknessW2: 0,
  notes: 'Prueba de operaciones',
  drills: [
    {
      id: 'dr-1',
      type: 'hinge_plate_5',
      face: 'face_A',
      x: 525,
      y: 100,
      diameter: 5,
      depth: 11,
      label: 'Contraplaca'
    }
  ],
  grooves: [],
  pockets: []
};

test('conserva cara y profundidad', () => {
  const manifest = buildCncOperationManifest(part);
  const drill = manifest.operations.drills[0];

  assert.equal(drill.face, 'face_A');
  assert.equal(drill.depth, 11);
  assert.equal(drill.diameter, 5);
});

test('distingue operaciones en caras diferentes', () => {
  const a = buildCncOperationManifest(part);

  const b = buildCncOperationManifest({
    ...part,
    drills: [
      { ...part.drills[0], face: 'face_B' }
    ]
  });

  assert.notDeepEqual(a.operations.drills, b.operations.drills);
});

test('distingue profundidades diferentes', () => {
  const a = buildCncOperationManifest(part);

  const b = buildCncOperationManifest({
    ...part,
    drills: [
      { ...part.drills[0], depth: 6 }
    ]
  });

  assert.notDeepEqual(a.operations.drills, b.operations.drills);
});

test('no declara el manifiesto apto para maquinaria', () => {
  const manifest = buildCncOperationManifest(part);

  assert.equal(manifest.readiness, 'NOT_MACHINE_READY');
  assert.equal(manifest.schemaVersion, 1);
});
