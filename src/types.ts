export interface Interest {
  id: string;
  name: string;
  why: string;
  scores: {
    passion: number;
    skill: number;
    impact: number;
    future: number;
  };
}

export interface Dimension {
  k: keyof Interest['scores'];
  l: string;
  t: string;
}

export interface Path {
  n: string;
  d: string;
  w: Record<keyof Interest['scores'], number>;
}

export interface Combination {
  a: string;
  b: string;
  desc: string;
  score: number;
}
