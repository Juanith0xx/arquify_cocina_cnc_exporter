import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { preparePhysicalCncParts } from '../src/services/cncPhysicalParts.js';
import { validateStandardCabinetOrientation } from '../src/services/validateCncOrientation.js';

import type { CncCabinetOrientation } from '../src/types/cncOrientation.js';
import type { CabinetType, Part } from '../src/types/cncInputs.js';
import type { CncSettings } from '../src/services/cncPhysicalParts.js';

function getFixture() {
  return JSON.parse(
    readFileSync(
      new URL('./fixtures/cncPlanPreview.fixture.json', import.meta.url),
      'utf8'
    )
  ) as {
    parts: Part[];
    cabinets: CabinetType[];
    settings: CncSettings;
    orientations: CncCabinetOrientation[];
  };
}

test('acepta una hoja DOOR_LEAF identificada por BOM', () => {
  const fixture = getFixture();
  const physical = preparePhysicalCncParts(
    fixture.parts,
    fixture.cabinets,
    fixture.settings
  );

  assert.doesNotThrow(() =>
    validateStandardCabinetOrientation(
      fixture.orientations[0],
      fixture.cabinets[0],
      physical
    )
  );
});

test('rechaza una puerta que apunta a una repisa u otra pieza sin DOOR_LEAF', () => {
  const fixture = getFixture();
  const shelfIndex = fixture.parts.findIndex(
    part => part.name.startsWith('Repisa') &&
      part.moduleId === fixture.cabinets[0].id
  );
  assert.notEqual(shelfIndex, -1);

  const physical = preparePhysicalCncParts(
    fixture.parts,
    fixture.cabinets,
    fixture.settings
  );
  const orientation = structuredClone(fixture.orientations[0]);
  orientation.doors[0].sourceBomIndex = shelfIndex;
  orientation.doors[0].physicalUnit = 1;

  assert.throws(
    () => validateStandardCabinetOrientation(
      orientation,
      fixture.cabinets[0],
      physical
    ),
    /Falta identidad de hoja de puerta verificada por BOM/
  );
});

test('rechaza una puerta sin identidad DOOR_LEAF', () => {
  const fixture = getFixture();
  const doorIndex = fixture.parts.findIndex(
    part => part.physicalUnits?.some(unit => unit.role === 'DOOR_LEAF')
  );
  assert.notEqual(doorIndex, -1);
  fixture.parts[doorIndex].physicalUnits = undefined;

  const physical = preparePhysicalCncParts(
    fixture.parts,
    fixture.cabinets,
    fixture.settings
  );
  assert.throws(
    () => validateStandardCabinetOrientation(
      fixture.orientations[0],
      fixture.cabinets[0],
      physical
    ),
    /Falta identidad de hoja de puerta verificada por BOM/
  );
});

test('rechaza una puerta que apunta a un lateral estructural', () => {
  const fixture = getFixture();
  const sideIndex = fixture.parts.findIndex(
    part => part.physicalUnits?.some(unit => unit.role === 'STRUCTURAL_SIDE')
  );
  assert.notEqual(sideIndex, -1);

  const physical = preparePhysicalCncParts(
    fixture.parts,
    fixture.cabinets,
    fixture.settings
  );
  const orientation = structuredClone(fixture.orientations[0]);
  orientation.doors[0].sourceBomIndex = sideIndex;
  orientation.doors[0].physicalUnit = 1;

  assert.throws(
    () => validateStandardCabinetOrientation(
      orientation,
      fixture.cabinets[0],
      physical
    ),
    /Referencia física duplicada|Falta identidad de hoja de puerta verificada por BOM/
  );
});
