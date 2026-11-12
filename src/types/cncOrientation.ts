export type CncSide = 'left' | 'right';
export type CncFace = 'face_A' | 'face_B';

interface CncPhysicalReference {
  sourceBomIndex: number;
  physicalUnit: number;
}

export interface CncStructuralSide
  extends CncPhysicalReference {
  role: 'STRUCTURAL_SIDE';
  side: CncSide;
  innerFace: CncFace;
}

export interface CncDoorLeaf
  extends CncPhysicalReference {
  role: 'DOOR_LEAF';
  hingeSide: CncSide;
  innerFace: CncFace;
}

export interface CncCabinetOrientation {
  cabinetId: string;
  doorLeaves: number;
  sides: CncStructuralSide[];
  doors: CncDoorLeaf[];
}
