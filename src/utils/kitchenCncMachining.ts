export interface CncDrill {
  id: string;
  type: 'hinge_cup_35' | 'hinge_plate_5' | 'slide_hole_5' | 'shelf_pin_5' | 'minifix_15' | 'minifix_bolt_8' | 'dowel_8' | 'screw_confirmat_5' | 'handle_hole';
  face: 'face_A' | 'face_B' | 'edge_L1' | 'edge_L2' | 'edge_W1' | 'edge_W2';
  x: number;
  y: number;
  diameter: number;
  depth: number;
  label: string;
}

export interface CncGroove {
  id: string;
  name: string;
  face: 'face_A' | 'face_B';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  depth: number;
}

export interface CncPocket {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

export interface CncMachinedPart {
  partCode: string;
  partName: string;
  moduleTag: string;
  moduleName: string;
  width: number;
  length: number;
  thickness: number;
  material: string;
  grainDirection: 'vertical' | 'horizontal';
  edgeL1: boolean;
  edgeL2: boolean;
  edgeW1: boolean;
  edgeW2: boolean;
  edgeThicknessL1: number;
  edgeThicknessL2: number;
  edgeThicknessW1: number;
  edgeThicknessW2: number;
  notes: string;
  drills: CncDrill[];
  grooves: CncGroove[];
  pockets: CncPocket[];
}
