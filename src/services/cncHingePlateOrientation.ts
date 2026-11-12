import type { PhysicalCncPart } from './cncPhysicalParts.js';
import {
  validateStandardCabinetOrientation
} from './validateCncOrientation.js';

type Orientation =
  Parameters<typeof validateStandardCabinetOrientation>[0];

type Cabinet =
  Parameters<typeof validateStandardCabinetOrientation>[1];

/**
 * Asigna las perforaciones de contraplacas al lateral
 * correspondiente a una puerta batiente.
 *
 * No modifica coordenadas, caras ni profundidades.
 * No produce instrucciones listas para maquinaria.
 */
export function applyHingePlateOrientation(
  physicalParts: PhysicalCncPart[],
  orientation: Orientation,
  cabinet: Cabinet
): PhysicalCncPart[] {
  if (cabinet.variant !== '1_door') {
    throw new Error(
      'Asignacion de contraplacas disponible solo para 1_door'
    );
  }

  validateStandardCabinetOrientation(
    orientation,
    cabinet,
    physicalParts
  );

  if (orientation.doors.length !== 1) {
    throw new Error(
      'Se requiere una unica hoja de puerta'
    );
  }

  const hingeSide = orientation.doors[0].hingeSide;

  if (hingeSide !== 'left' && hingeSide !== 'right') {
    throw new Error(
      'El lado de bisagra debe estar definido'
    );
  }

  return physicalParts.map(part => {
    const identity = part.physicalIdentity;

    // No modificar otros gabinetes ni piezas no estructurales.
    if (
      part.sourceModuleId !== cabinet.id ||
      identity?.role !== 'STRUCTURAL_SIDE'
    ) {
      return part;
    }

    // El lateral de bisagras mantiene sus perforaciones.
    if (identity.side === hingeSide) {
      return part;
    }

    // El lateral opuesto conserva todos los otros mecanizados.
    return {
      ...part,
      cnc: {
        ...part.cnc,
        drills: part.cnc.drills.filter(
          drill => drill.type !== 'hinge_plate_5'
        )
      }
    };
  });
}
