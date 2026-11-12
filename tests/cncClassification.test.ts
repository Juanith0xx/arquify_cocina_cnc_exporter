import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateCncMachiningForPart
} from '../src/utils/kitchenCncMachiningEngine.js';

const cabinet = {
  id: 'mueble-1',
  type: 'base' as const,
  width: 60,
  height: 90,
  depth: 58
};

function calculate(
  name: string,
  width: number,
  length: number,
  thickness = 18
) {
  return calculateCncMachiningForPart(
    {
      moduleId: cabinet.id,
      moduleIndex: 0,
      name,
      qty: 1,
      width,
      length,
      thickness,
      material: '#FFFFFF',
      edgeL1: false,
      edgeL2: false,
      edgeW1: false,
      edgeW2: false
    },
    cabinet,
    'Provelcar',
    'spax',
    'none'
  );
}

test('puerta no recibe ranura horizontal de piso', () => {
  const part = calculate('Puerta Frontal (Cab 1 base)', 594, 794);

  assert.equal(part.grooves.length, 0);
  assert.equal(part.drills.length, 6);
});

test('barra frontal no se clasifica como piso', () => {
  const part = calculate(
    'Barra Frontal Superior (Cab 1 base)', 100, 564
  );

  assert.equal(part.grooves.length, 0);
});

test('fondo Durolac no recibe ranura de piso', () => {
  const part = calculate(
    'Fondo Trasera (Cab 1 base)', 564, 782, 3
  );

  assert.equal(part.grooves.length, 0);
});

test('piso conserva su ranura prevista', () => {
  const part = calculate('Piso (Cab 1 base)', 562, 564);

  assert.equal(part.grooves.length, 1);
});

test('lateral conserva una sola ranura posterior', () => {
  const part = calculate('Lateral (Cab 1 base)', 562, 800);

  assert.equal(part.grooves.length, 1);
  assert.equal(part.drills.length, 8);
});
