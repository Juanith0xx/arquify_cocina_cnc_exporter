import {
  calculateCncMachiningForPart
} from '../utils/kitchenCncMachiningEngine.js';

import type {
  CncMachinedPart
} from '../utils/kitchenCncMachiningEngine.js';

import type {
  Part,
  CabinetType,
  KitchenHandleConfig
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
