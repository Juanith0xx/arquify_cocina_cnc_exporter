type ObjectValue = Record<string, unknown>;

function isObject(value: unknown): value is ObjectValue {
  return typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value);
}

function positive(value: unknown): value is number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0;
}

export function validateCncPart(input: unknown): string | null {
  if (!isObject(input)) {
    return 'La pieza debe ser un objeto válido';
  }

  const part = input;

  if (
    !positive(part.width) ||
    !positive(part.length) ||
    !positive(part.thickness)
  ) {
    return 'Las dimensiones de la pieza deben ser positivas y finitas';
  }

  if (
    !Array.isArray(part.drills) ||
    !Array.isArray(part.grooves) ||
    !Array.isArray(part.pockets)
  ) {
    return 'Drills, grooves y pockets deben ser arreglos';
  }

  const width = part.width;
  const length = part.length;

  for (const [index, value] of part.drills.entries()) {
    if (!isObject(value)) {
      return `Perforación ${index}: objeto inválido`;
    }

    const drill = value;

    if (
      typeof drill.x !== 'number' ||
      typeof drill.y !== 'number' ||
      !Number.isFinite(drill.x) ||
      !Number.isFinite(drill.y) ||
      !positive(drill.diameter) ||
      !positive(drill.depth)
    ) {
      return `Perforación ${index}: coordenadas o dimensiones inválidas`;
    }

    const validFaces = [
      'face_A', 'face_B',
      'edge_L1', 'edge_L2',
      'edge_W1', 'edge_W2'
    ];

    if (
      typeof drill.face !== 'string' ||
      !validFaces.includes(drill.face)
    ) {
      return `Perforación ${index}: cara inválida`;
    }

    // Validación geométrica para las caras principales.
    if (drill.face === 'face_A' || drill.face === 'face_B') {
      const radius = drill.diameter / 2;

      if (
        drill.x - radius < 0 ||
        drill.y - radius < 0 ||
        drill.x + radius > width ||
        drill.y + radius > length
      ) {
        return `Perforación ${index}: fuera de los límites del tablero`;
      }

      if (drill.depth > part.thickness) {
        return `Perforación ${index}: profundidad superior al espesor`;
      }
    }
  }

  return null;
}
