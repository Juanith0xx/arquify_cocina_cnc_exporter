export type PartPhysicalUnit =
  | {
      unit: number;
      role: 'STRUCTURAL_SIDE';
      side: 'left' | 'right';
    }
  | {
      unit: number;
      role: 'DOOR_LEAF';
      side?: never;
    };

export interface Part {
  moduleId: string;
  moduleIndex: number;
  name: string;
  qty: number;
  length: number;
  width: number;
  thickness: number;
  material: string;
  edgeL1: boolean;
  edgeL2: boolean;
  edgeW1: boolean;
  edgeW2: boolean;
  notes?: string;
  grainDirection?: 'vertical' | 'horizontal';
  isHpl?: boolean;
  materialCategory?: 'doors' | 'structure' | 'backs' | 'cover';
  physicalUnits?: PartPhysicalUnit[];
}

export interface CabinetType {
  id: string;
  type: 'base' | 'wall' | 'tall' | 'island' | 'decoration' | 'closet';
  variant?: string;
  width: number;
  height: number;
  depth: number;
  hasDoors?: boolean;
}

export interface KitchenHandleConfig {
  model: string;
  lengthMm: number;
  finish: string;
  orientation: 'horizontal' | 'vertical' | 'auto';
}
