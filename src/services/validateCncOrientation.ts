import type {
  CncCabinetOrientation
} from '../types/cncOrientation.js';

import type {
  CabinetType
} from '../types/cncInputs.js';

import type {
  PhysicalCncPart
} from './cncPhysicalParts.js';

function referenceKey(
  moduleId: string,
  bomIndex: number,
  physicalUnit: number
): string {
  return JSON.stringify([
    moduleId,
    bomIndex,
    physicalUnit
  ]);
}

export function validateStandardCabinetOrientation(
  orientation: CncCabinetOrientation,
  cabinet: CabinetType,
  physicalParts: readonly PhysicalCncPart[]
): void {
  if (orientation.cabinetId !== cabinet.id) {
    throw new Error('El identificador del gabinete no coincide');
  }

  const expectedDoors =
    cabinet.variant === '1_door' ? 1 :
    cabinet.variant === '2_doors' ? 2 :
    null;

  if (expectedDoors === null || cabinet.hasDoors === false) {
    throw new Error('Configuración de gabinete no soportada');
  }

  if (
    orientation.doorLeaves !== expectedDoors ||
    orientation.doors.length !== expectedDoors
  ) {
    throw new Error('Cantidad de hojas inconsistente');
  }

  if (orientation.sides.length !== 2) {
    throw new Error('Se requieren dos laterales físicos');
  }

  const physicalKeys = new Set(
    physicalParts
      .filter(part => part.sourceModuleId === cabinet.id)
      .map(part => referenceKey(
        part.sourceModuleId,
        part.sourceBomIndex,
        part.physicalUnit
      ))
  );

  const usedReferences = new Set<string>();

  for (const ref of [...orientation.sides, ...orientation.doors]) {
    if (
      !Number.isSafeInteger(ref.sourceBomIndex) ||
      ref.sourceBomIndex < 0 ||
      !Number.isSafeInteger(ref.physicalUnit) ||
      ref.physicalUnit < 1
    ) {
      throw new Error('Referencia física inválida');
    }

    if (!['face_A', 'face_B'].includes(ref.innerFace)) {
      throw new Error('Cara de mecanizado inválida');
    }

    const key = referenceKey(
      cabinet.id,
      ref.sourceBomIndex,
      ref.physicalUnit
    );

    if (!physicalKeys.has(key)) {
      throw new Error('Referencia física inexistente');
    }

    if (usedReferences.has(key)) {
      throw new Error('Referencia física duplicada');
    }

    usedReferences.add(key);
  }

  const sides = orientation.sides.map(side => {
    if (
      side.role !== 'STRUCTURAL_SIDE' ||
      !['left', 'right'].includes(side.side)
    ) {
      throw new Error('Rol o lado estructural inválido');
    }
    return side.side;
  });

  if (
    new Set(sides).size !== 2 ||
    !sides.includes('left') ||
    !sides.includes('right')
  ) {
    throw new Error('Falta lateral izquierdo o derecho');
  }

  const hinges = orientation.doors.map(door => {
    if (
      door.role !== 'DOOR_LEAF' ||
      !['left', 'right'].includes(door.hingeSide)
    ) {
      throw new Error('Orientación de puerta inválida');
    }
    return door.hingeSide;
  });

  if (
    expectedDoors === 2 &&
    new Set(hinges).size !== 2
  ) {
    throw new Error(
      'Las dos hojas deben tener lados de bisagra opuestos'
    );
  }
}
