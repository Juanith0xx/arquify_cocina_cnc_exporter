import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  buildCncPlanPreview,
  type CncPlanPreviewInput
} from '../src/services/cncPlanPreview.js';

const fixture = JSON.parse(
  readFileSync(
    new URL('./fixtures/cncPlanPreview.fixture.json', import.meta.url),
    'utf8'
  )
) as CncPlanPreviewInput;

const makeInput = (): CncPlanPreviewInput =>
  structuredClone(fixture);

function countPlates(
  preview: ReturnType<typeof buildCncPlanPreview>,
  side: 'left' | 'right'
): number {
  const piece = preview.pieces.find(
    item =>
      item.physicalIdentity?.role === 'STRUCTURAL_SIDE' &&
      item.physicalIdentity.side === side
  );

  assert.ok(piece);

  return piece.manifest.operations.drills.filter(
    drill => drill.type === 'hinge_plate_5'
  ).length;
}

test('plan CNC con bisagras izquierdas', () => {
  const preview = buildCncPlanPreview(makeInput());

  assert.equal(preview.physicalPieceCount, 9);
  assert.equal(preview.readiness, 'NOT_MACHINE_READY');
  assert.equal(countPlates(preview, 'left'), 4);
  assert.equal(countPlates(preview, 'right'), 0);
});

test('plan CNC con bisagras derechas', () => {
  const input = makeInput();

  input.orientations[0].doors[0].hingeSide = 'right';

  const preview = buildCncPlanPreview(input);

  assert.equal(preview.physicalPieceCount, 9);
  assert.equal(countPlates(preview, 'left'), 0);
  assert.equal(countPlates(preview, 'right'), 4);
});

test('rechaza gabinete sin orientación', () => {
  const input = makeInput();
  input.orientations = [];

  assert.throws(
    () => buildCncPlanPreview(input),
    /orientación única/
  );
});

test('rechaza puertas dobles todavía no soportadas', () => {
  const input = makeInput();
  input.cabinets[0].variant = '2_doors';

  assert.throws(
    () => buildCncPlanPreview(input),
    /solo para 1_door/
  );
});

test('rechaza hasDoors sin definición explícita', () => {
  const input = makeInput();

  Object.assign(input.cabinets[0], {
    hasDoors: undefined
  });

  assert.throws(
    () => buildCncPlanPreview(input),
    /configuración válida/
  );
});

test('rechaza piezas con gabinete desconocido', () => {
  const input = makeInput();

  input.parts[0].moduleId = 'gabinete-inexistente';

  assert.throws(
    () => buildCncPlanPreview(input),
    /Pieza BOM sin gabinete válido/
  );
});

test('rechaza orientaciones duplicadas', () => {
  const input = makeInput();

  input.orientations.push(
    structuredClone(input.orientations[0])
  );

  assert.throws(
    () => buildCncPlanPreview(input),
    /orientación única/
  );
});

test('no modifica los datos originales de entrada', () => {
  const input = makeInput();
  const original = structuredClone(input);

  buildCncPlanPreview(input);

  assert.deepEqual(input, original);
});
