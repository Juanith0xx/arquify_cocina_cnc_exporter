import test from 'node:test';
import assert from 'node:assert/strict';

import {
  preparePhysicalCncParts
} from '../src/services/cncPhysicalParts.js';

import type {
  Part,
  CabinetType
} from '../src/types/cncInputs.js';

const cabinet: CabinetType = {
  id: 'MOD-001',
  type: 'base',
  width: 60,
  height: 90,
  depth: 58
};

const sample: Part[] = [
  {
    moduleId: 'MOD-001',
    moduleIndex: 0,
    name: 'Lateral (Cab 1 base)',
    qty: 2,
    width: 562,
    length: 800,
    thickness: 18,
    material: '#FFFFFF',
    edgeL1: true,
    edgeL2: false,
    edgeW1: true,
    edgeW2: true
  },
  {
    moduleId: 'MOD-001',
    moduleIndex: 0,
    name: 'Barra Frontal Superior (Cab 1 base)',
    qty: 1,
    width: 100,
    length: 564,
    thickness: 18,
    material: '#FFFFFF',
    edgeL1: true,
    edgeL2: false,
    edgeW1: false,
    edgeW2: false
  },
  {
    moduleId: 'MOD-001',
    moduleIndex: 0,
    name: 'Barra Refuerzo Trasera Superior (Cab 1 base)',
    qty: 1,
    width: 100,
    length: 564,
    thickness: 18,
    material: '#FFFFFF',
    edgeL1: true,
    edgeL2: false,
    edgeW1: false,
    edgeW2: false
  }
];

const settings = {
  hardwareBrand: 'Provelcar',
  assemblyType: 'spax',
  golaSystem: 'none'
} as const;

test('genera una entrada por pieza física', () => {
  const result = preparePhysicalCncParts(
    sample, [cabinet], settings
  );

  assert.equal(result.length, 4);
});

test('genera identificadores CNC únicos', () => {
  const result = preparePhysicalCncParts(
    sample, [cabinet], settings
  );

  const codes = result.map(item => item.cnc.partCode);

  assert.equal(new Set(codes).size, codes.length);
});

test('conserva el código original', () => {
  const result = preparePhysicalCncParts(
    sample, [cabinet], settings
  );

  assert.equal(result[0].originalPartCode, 'B-1.LAT');
  assert.equal(result[0].cnc.partCode, 'B-1.LAT-P001-U001');
  assert.equal(result[1].cnc.partCode, 'B-1.LAT-P001-U002');

  assert.equal(result[2].originalPartCode, 'B-1.BAR');
  assert.equal(result[3].originalPartCode, 'B-1.BAR');
  assert.notEqual(result[2].cnc.partCode, result[3].cnc.partCode);
});

test('conserva trazabilidad hacia BOM', () => {
  const result = preparePhysicalCncParts(
    sample, [cabinet], settings
  );

  assert.equal(result[0].sourceModuleId, 'MOD-001');
  assert.equal(result[0].sourceBomIndex, 0);
  assert.equal(result[1].physicalUnit, 2);
});

test('rechaza piezas sin módulo de origen', () => {
  assert.throws(
    () => preparePhysicalCncParts(sample, [], settings),
    /No existe el módulo/
  );
});

test('rechaza cantidades inválidas', () => {
  assert.throws(
    () => preparePhysicalCncParts(
      [{ ...sample[0], qty: -2 }],
      [cabinet],
      settings
    ),
    /Pieza BOM inválida/
  );
});
