import type {
  CncMachinedPart
} from '../utils/kitchenCncMachining.js';

/**
 * Manifiesto de operaciones de revisión.
 * No es un programa de maquinaria CNC.
 */
export function buildCncOperationManifest(
  part: CncMachinedPart
) {
  const {
    drills,
    grooves,
    pockets,
    ...piece
  } = part;

  return {
    format: 'arquify-cnc-operations',
    schemaVersion: 1,
    readiness: 'NOT_MACHINE_READY' as const,

    piece: { ...piece },

    operations: {
      drills: drills.map(operation => ({ ...operation })),
      grooves: grooves.map(operation => ({ ...operation })),
      pockets: pockets.map(operation => ({ ...operation }))
    },

    limitations: [
      'Requiere validacion de orientacion y caras',
      'Los destajes no incluyen cara de mecanizado',
      'No incluye instrucciones especificas de maquina',
      'Requiere validacion geometrica y postprocesador CAM'
    ]
  };
}
