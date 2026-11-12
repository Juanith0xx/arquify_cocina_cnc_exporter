import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateCncMachiningForPart
} from '../src/utils/kitchenCncMachiningEngine.js';

import type {
  CabinetType,
  Part
} from '../src/types/cncInputs.js';

const cabinet: CabinetType = {
  id: 'MOD-001',
  type: 'base',
  width: 60,
  height: 90,
  depth: 58
};

function calculate(
  name: string,
  hasDoors: boolean
) {
  const part: Part = {
    moduleId: 'MOD-001',
    moduleIndex: 0,
    name,
    qty: 1,
    width: 562,
    length: 800,
    thickness: 18,
    material: '#FFFFFF',
    edgeL1: false,
    edgeL2: false,
    edgeW1: false,
    edgeW2: false
  };

  return calculateCncMachiningForPart(
    part,
    { ...cabinet, hasDoors },
    'Provelcar',
    'spax',
    'none'
  );
}

test('tapa decorativa no recibe mecanizados estructurales', () => {
  const cnc = calculate(
    'Tapa Lateral Izq. Vista (Cab 1 base)',
    true
  );

  assert.equal(cnc.drills.length, 0);
  assert.equal(cnc.grooves.length, 0);
});

test('gabinete sin puertas no recibe contraplacas', () => {
  const cnc = calculate(
    'Lateral (Cab 1 base)',
    false
  );

  const hingePlates = cnc.drills.filter(
    drill => drill.type === 'hinge_plate_5'
  );

  assert.equal(hingePlates.length, 0);
});

test('gabinete con puertas conserva sus contraplacas', () => {
  const cnc = calculate(
    'Lateral (Cab 1 base)',
    true
  );

  const hingePlates = cnc.drills.filter(
    drill => drill.type === 'hinge_plate_5'
  );

  assert.equal(hingePlates.length, 4);
});
