import {
  calculateCncMachiningForPart
} from '../utils/kitchenCncMachiningEngine.js';

import type {
  CncMachinedPart
} from '../utils/kitchenCncMachiningEngine.js';

import type {
  Part,
  CabinetType,
  KitchenHandleConfig,
  PartPhysicalUnit
} from '../types/cncInputs.js';

export interface CncSettings {
  hardwareBrand: 'Hafele' | 'Provelcar';
  assemblyType: NonNullable<
    Parameters<typeof calculateCncMachiningForPart>[3]
  >;
  golaSystem: NonNullable<
    Parameters<typeof calculateCncMachiningForPart>[4]
  >;
  handleConfig?: KitchenHandleConfig;
}

export interface PhysicalCncPart {
  sourceModuleId: string;
  sourceBomIndex: number;
  physicalUnit: number;
  physicalIdentity?: PartPhysicalUnit;
  originalPartCode: string;
  cnc: CncMachinedPart;
}

export function preparePhysicalCncParts(
  parts: Part[],
  cabinets: CabinetType[],
  settings: CncSettings
): PhysicalCncPart[] {
  if (!Array.isArray(parts) || !Array.isArray(cabinets)) {
    throw new Error('Se requieren piezas y módulos válidos');
  }

  const cabinetsById = new Map<string, CabinetType>();

  for (const cab of cabinets) {
    if (!cab?.id || cabinetsById.has(cab.id)) {
      throw new Error('Módulo inválido o duplicado');
    }

    cabinetsById.set(cab.id, cab);
  }

  const result: PhysicalCncPart[] = [];
  let physicalCount = 0;

  for (const [index, part] of parts.entries()) {
    if (
      !part ||
      !Number.isSafeInteger(part.qty) ||
      part.qty <= 0 ||
      ![part.width, part.length, part.thickness].every(
        n => Number.isFinite(n) && n > 0
      ) ||
      typeof part.name !== 'string' ||
      !part.name.trim() ||
      typeof part.material !== 'string' ||
      !part.material.trim()
    ) {
      throw new Error(`Pieza BOM inválida: ${index}`);
    }

    const identities = new Map<number, PartPhysicalUnit>();

    if (part.physicalUnits !== undefined) {
      if (
        !Array.isArray(part.physicalUnits) ||
        part.physicalUnits.length !== part.qty
      ) {
        throw new Error(
          `Identidades físicas incompletas: ${index}`
        );
      }

      for (const identity of part.physicalUnits) {
        if (
          !identity ||
          !Number.isSafeInteger(identity.unit) ||
          identity.unit < 1 ||
          identity.unit > part.qty ||
          identity.role !== 'STRUCTURAL_SIDE' ||
          (identity.side !== 'left' && identity.side !== 'right') ||
          identities.has(identity.unit)
        ) {
          throw new Error(
            `Identidad física inválida: ${index}`
          );
        }

        identities.set(identity.unit, identity);
      }

      const sides = [...identities.values()].map(
        identity => identity.side
      );

      if (new Set(sides).size !== sides.length) {
        throw new Error(
          `Lados físicos duplicados: ${index}`
        );
      }
    }

    const cabinet = cabinetsById.get(part.moduleId);

    if (!cabinet) {
      throw new Error(
        `No existe el módulo de la pieza: ${part.moduleId}`
      );
    }

    physicalCount += part.qty;

    if (physicalCount > 500) {
      throw new Error('Máximo 500 piezas físicas por solicitud');
    }

    for (let unit = 1; unit <= part.qty; unit++) {
      const machined = calculateCncMachiningForPart(
        part,
        cabinet,
        settings.hardwareBrand,
        settings.assemblyType,
        settings.golaSystem,
        settings.handleConfig
      );

      const originalPartCode = machined.partCode;

      const uniqueCode =
        `${originalPartCode}` +
        `-P${String(index + 1).padStart(3, '0')}` +
        `-U${String(unit).padStart(3, '0')}`;

      result.push({
        sourceModuleId: part.moduleId,
        sourceBomIndex: index,
        physicalUnit: unit,
        physicalIdentity: identities.get(unit),
        originalPartCode,
        cnc: {
          ...machined,
          partCode: uniqueCode
        }
      });
    }
  }

  const codes = result.map(item => item.cnc.partCode);

  if (new Set(codes).size !== codes.length) {
    throw new Error('Se detectaron identificadores CNC duplicados');
  }

  return result;
}
