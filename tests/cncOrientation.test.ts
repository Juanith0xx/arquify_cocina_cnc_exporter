import { applyHingePlateOrientation } from '../src/services/cncHingePlateOrientation.js';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  preparePhysicalCncParts
} from '../src/services/cncPhysicalParts.js';

import {
  validateStandardCabinetOrientation
} from '../src/services/validateCncOrientation.js';

import type {
  CabinetType,
  Part
} from '../src/types/cncInputs.js';

import type {
  CncCabinetOrientation
} from '../src/types/cncOrientation.js';

const cabinet: CabinetType = {
  id: 'MOD-001',
  type: 'base',
  variant: '1_door',
  width: 60,
  height: 90,
  depth: 58,
  hasDoors: true
};

const lateral: Part = {
  moduleId: cabinet.id,
  moduleIndex: 0,
  name: 'Lateral (Cab 1 base)',
  qty: 2,
  physicalUnits: [
    { unit: 1, role: 'STRUCTURAL_SIDE', side: 'left' },
    { unit: 2, role: 'STRUCTURAL_SIDE', side: 'right' }
  ],
  width: 562,
  length: 800,
  thickness: 18,
  material: '#FFFFFF',
  edgeL1: false,
  edgeL2: false,
  edgeW1: false,
  edgeW2: false
};

const door: Part = {
  ...lateral,
  physicalUnits: undefined,
  name: 'Puerta Frontal (Cab 1 base)',
  qty: 1,
  width: 594,
  length: 794
};

const settings = {
  hardwareBrand: 'Provelcar',
  assemblyType: 'spax',
  golaSystem: 'none'
} as const;

const physical = preparePhysicalCncParts(
  [lateral, door],
  [cabinet],
  settings
);

// Referencias de prueba, no un mapeo físico certificado.
const orientation: CncCabinetOrientation = {
  cabinetId: cabinet.id,
  doorLeaves: 1,
  sides: [
    {
      role: 'STRUCTURAL_SIDE',
      sourceBomIndex: 0,
      physicalUnit: 1,
      side: 'left',
      innerFace: 'face_A'
    },
    {
      role: 'STRUCTURAL_SIDE',
      sourceBomIndex: 0,
      physicalUnit: 2,
      side: 'right',
      innerFace: 'face_B'
    }
  ],
  doors: [
    {
      role: 'DOOR_LEAF',
      sourceBomIndex: 1,
      physicalUnit: 1,
      hingeSide: 'left',
      innerFace: 'face_A'
    }
  ]
};

test('acepta referencias completas para una puerta', () => {
  assert.doesNotThrow(() =>
    validateStandardCabinetOrientation(
      orientation, cabinet, physical
    )
  );
});

test('rechaza laterales incompletos', () => {
  assert.throws(
    () => validateStandardCabinetOrientation(
      {
        ...orientation,
        sides: [orientation.sides[0]]
      },
      cabinet,
      physical
    ),
    /dos laterales/
  );
});

test('rechaza dos laterales con el mismo lado', () => {
  assert.throws(
    () => validateStandardCabinetOrientation(
      {
        ...orientation,
        sides: [
          orientation.sides[0],
          { ...orientation.sides[1], side: 'left' }
        ]
      },
      cabinet,
      physical
    ),
    /izquierdo o derecho/
  );
});

test('rechaza referencias físicas duplicadas', () => {
  assert.throws(
    () => validateStandardCabinetOrientation(
      {
        ...orientation,
        sides: [
          orientation.sides[0],
          {
            ...orientation.sides[1],
            physicalUnit: 1
          }
        ]
      },
      cabinet,
      physical
    ),
    /duplicada/
  );
});

test('rechaza referencias inexistentes', () => {
  assert.throws(
    () => validateStandardCabinetOrientation(
      {
        ...orientation,
        doors: [
          { ...orientation.doors[0], physicalUnit: 9 }
        ]
      },
      cabinet,
      physical
    ),
    /inexistente/
  );
});

test('rechaza gabinete incorrecto', () => {
  assert.throws(
    () => validateStandardCabinetOrientation(
      { ...orientation, cabinetId: 'OTRO' },
      cabinet,
      physical
    ),
    /no coincide/
  );
});

test('admite dos puertas con bisagras opuestas', () => {
  const doubleCabinet: CabinetType = {
    ...cabinet,
    variant: '2_doors'
  };

  const doublePhysical = preparePhysicalCncParts(
    [lateral, { ...door, qty: 2 }],
    [doubleCabinet],
    settings
  );

  const doubleOrientation: CncCabinetOrientation = {
    ...orientation,
    doorLeaves: 2,
    doors: [
      orientation.doors[0],
      {
        ...orientation.doors[0],
        physicalUnit: 2,
        hingeSide: 'right'
      }
    ]
  };

  assert.doesNotThrow(() =>
    validateStandardCabinetOrientation(
      doubleOrientation,
      doubleCabinet,
      doublePhysical
    )
  );
});

test('rechaza dos puertas con bisagras del mismo lado', () => {
  const doubleCabinet: CabinetType = {
    ...cabinet,
    variant: '2_doors'
  };

  const doublePhysical = preparePhysicalCncParts(
    [lateral, { ...door, qty: 2 }],
    [doubleCabinet],
    settings
  );

  assert.throws(
    () => validateStandardCabinetOrientation(
      {
        ...orientation,
        doorLeaves: 2,
        doors: [
          orientation.doors[0],
          {
            ...orientation.doors[0],
            physicalUnit: 2
          }
        ]
      },
      doubleCabinet,
      doublePhysical
    ),
    /opuestos/
  );
});


test('rechaza un lado que contradice la identidad BOM', () => {
  assert.throws(
    () => validateStandardCabinetOrientation(
      {
        ...orientation,
        sides: [
          { ...orientation.sides[0], side: 'right' },
          { ...orientation.sides[1], side: 'left' }
        ]
      },
      cabinet,
      physical
    ),
    /contradice la identidad física BOM/
  );
});

test('rechaza laterales sin identidad estructural BOM', () => {
  const withoutIdentity = physical.map(item => ({
    ...item,
    physicalIdentity: undefined
  }));

  assert.throws(
    () => validateStandardCabinetOrientation(
      orientation,
      cabinet,
      withoutIdentity
    ),
    /Falta identidad estructural/
  );
});


// Validación de selección de contraplacas para una puerta.
for (const hingeSide of ['left', 'right'] as const) {
  test(`conserva contraplacas solo en lateral ${hingeSide}`, () => {
    const configuredOrientation = {
      ...orientation,
      doors: orientation.doors.map(door => ({
        ...door,
        hingeSide
      }))
    };

    const result = applyHingePlateOrientation(
      physical,
      configuredOrientation,
      cabinet
    );

    const findSide = (
      parts: typeof physical,
      side: 'left' | 'right'
    ) => {
      const found = parts.find(
        item =>
          item.physicalIdentity?.role === 'STRUCTURAL_SIDE' &&
          item.physicalIdentity.side === side
      );

      assert.ok(found);
      return found;
    };

    const oppositeSide =
      hingeSide === 'left' ? 'right' : 'left';

    const originalHinged = findSide(physical, hingeSide);
    const originalOpposite = findSide(physical, oppositeSide);

    const resultHinged = findSide(result, hingeSide);
    const resultOpposite = findSide(result, oppositeSide);

    const countPlates = (item: typeof originalHinged) =>
      item.cnc.drills.filter(
        drill => drill.type === 'hinge_plate_5'
      ).length;

    assert.ok(countPlates(originalHinged) > 0);
    assert.ok(countPlates(originalOpposite) > 0);

    // Se mantienen las operaciones del lateral de bisagras.
    assert.deepEqual(
      resultHinged.cnc,
      originalHinged.cnc
    );

    // Se eliminan exclusivamente las contraplacas opuestas.
    assert.equal(countPlates(resultOpposite), 0);

    assert.equal(
      resultOpposite.cnc.drills.length,
      originalOpposite.cnc.drills.length -
        countPlates(originalOpposite)
    );

    // Ranuras y destajes permanecen intactos.
    assert.deepEqual(
      resultOpposite.cnc.grooves,
      originalOpposite.cnc.grooves
    );

    assert.deepEqual(
      resultOpposite.cnc.pockets,
      originalOpposite.cnc.pockets
    );

    // La operación no altera las piezas de entrada.
    assert.ok(countPlates(originalOpposite) > 0);
    assert.equal(result.length, physical.length);
  });
}
