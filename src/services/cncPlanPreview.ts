import type {
  Part,
  CabinetType
} from '../types/cncInputs.js';

import type {
  CncCabinetOrientation
} from '../types/cncOrientation.js';

import {
  preparePhysicalCncParts,
  type CncSettings
} from './cncPhysicalParts.js';

import {
  applyHingePlateOrientation
} from './cncHingePlateOrientation.js';

import {
  buildCncOperationManifest
} from './cncOperationManifest.js';

import { validateCncPart } from '../utils/cncValidation.js';

export interface CncPlanPreviewInput {
  parts: Part[];
  cabinets: CabinetType[];
  settings: CncSettings;
  orientations: CncCabinetOrientation[];
}

/**
 * Previsualización de operaciones CNC.
 * No genera archivos ni instrucciones para maquinaria.
 */
export function buildCncPlanPreview(input: CncPlanPreviewInput) {
  if (
    !input ||
    !Array.isArray(input.parts) ||
    !Array.isArray(input.cabinets) ||
    !Array.isArray(input.orientations) ||
    !input.settings ||
    typeof input.settings !== 'object' ||
    Array.isArray(input.settings)
  ) {
    throw new Error('Solicitud de fabricación incompleta');
  }

  if (
    input.parts.length === 0 ||
    input.parts.length > 200 ||
    input.cabinets.length === 0 ||
    input.cabinets.length > 50
  ) {
    throw new Error('Cantidad de piezas o gabinetes inválida');
  }

  const cabinetIds = new Set<string>();

  for (const cabinet of input.cabinets) {
    if (
      !cabinet ||
      typeof cabinet.id !== 'string' ||
      !cabinet.id.trim() ||
      typeof cabinet.hasDoors !== 'boolean'
    ) {
      throw new Error('Gabinete sin identidad o configuración válida');
    }

    if (cabinetIds.has(cabinet.id)) {
      throw new Error('Gabinetes duplicados');
    }

    cabinetIds.add(cabinet.id);
  }

  for (const part of input.parts) {
    if (!part || !cabinetIds.has(part.moduleId)) {
      throw new Error('Pieza BOM sin gabinete válido');
    }
  }

  for (const orientation of input.orientations) {
    if (!orientation || !cabinetIds.has(orientation.cabinetId)) {
      throw new Error('Orientación de gabinete desconocido');
    }
  }

  // Validar configuraciones antes de calcular mecanizados.
  for (const cabinet of input.cabinets) {
    const matches = input.orientations.filter(
      orientation => orientation.cabinetId === cabinet.id
    );

    if (!cabinet.hasDoors) {
      if (matches.length !== 0) {
        throw new Error(
          'Un gabinete sin puertas no debe recibir orientación de puertas'
        );
      }
      continue;
    }

    if (cabinet.variant !== '1_door') {
      throw new Error(
        'Previsualización orientada disponible solo para 1_door'
      );
    }

    if (matches.length !== 1) {
      throw new Error(
        'Cada gabinete con puerta requiere una orientación única'
      );
    }
  }

  let physical = preparePhysicalCncParts(
    input.parts,
    input.cabinets,
    input.settings
  );

  if (physical.length > 200) {
    throw new Error('Demasiadas piezas físicas');
  }

  for (const cabinet of input.cabinets) {
    if (cabinet.hasDoors) {
      const orientation = input.orientations.find(
        item => item.cabinetId === cabinet.id
      )!;

      physical = applyHingePlateOrientation(
        physical,
        orientation,
        cabinet
      );
    } else {
      const unexpected = physical.some(
        item =>
          item.sourceModuleId === cabinet.id &&
          item.cnc.drills.some(
            drill => drill.type === 'hinge_plate_5'
          )
      );

      if (unexpected) {
        throw new Error(
          'Gabinete sin puertas contiene contraplacas'
        );
      }
    }
  }

  const codes = physical.map(item => item.cnc.partCode);

  if (new Set(codes).size !== codes.length) {
    throw new Error('Códigos CNC físicos duplicados');
  }

  for (const item of physical) {
    const error = validateCncPart(item.cnc);

    if (error) {
      throw new Error(
        `Pieza ${item.cnc.partCode}: ${error}`
      );
    }
  }

  return {
    format: 'arquify-cnc-plan-preview',
    schemaVersion: 1,
    readiness: 'NOT_MACHINE_READY' as const,
    cabinetCount: input.cabinets.length,
    physicalPieceCount: physical.length,

    pieces: physical.map(item => ({
      sourceModuleId: item.sourceModuleId,
      sourceBomIndex: item.sourceBomIndex,
      physicalUnit: item.physicalUnit,
      physicalIdentity: item.physicalIdentity ?? null,
      manifest: buildCncOperationManifest(item.cnc)
    })),

    limitations: [
      'No verifica geometria industrial de las perforaciones',
      'No aplica transformaciones verificadas de caras A/B',
      'No admite mecanizado orientado de puertas dobles',
      'No genera instrucciones de maquinaria ni CAM'
    ]
  };
}
