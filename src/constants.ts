import { Dimension, Path } from './types';

export const DIMS: Dimension[] = [
  { k: 'passion', l: 'Passion', t: 'How excited does this make you?' },
  { k: 'skill', l: 'Natural skill', t: 'How naturally good are you?' },
  { k: 'impact', l: 'World impact', t: 'How much could this help others?' },
  { k: 'future', l: 'Future fit', t: 'How relevant in 10 years?' },
];

export const PATHS: Path[] = [
  { n: 'The Synthesiser', d: 'Combines domains to create novel insights. Your range is your edge.', w: { passion: 0.3, skill: 0.25, impact: 0.25, future: 0.2 } },
  { n: 'The Curator', d: 'Wide taste, filters signal from noise. Makes sense of information overload.', w: { passion: 0.35, skill: 0.2, impact: 0.2, future: 0.25 } },
  { n: 'The Builder-Connector', d: 'Prototypes ideas and connects them to markets. Thrives as a creative founder.', w: { passion: 0.2, skill: 0.3, impact: 0.25, future: 0.25 } },
  { n: 'The Translator', d: 'Bridges technical and non-technical worlds. More critical as AI capability grows.', w: { passion: 0.2, skill: 0.3, impact: 0.3, future: 0.2 } },
  { n: 'The Practitioner-Teacher', d: 'Learns deeply, then teaches it. High value as AI democratises tools.', w: { passion: 0.3, skill: 0.25, impact: 0.3, future: 0.15 } },
];

export const CORES: Record<string, string> = {
  meditat: 'stillness, self-awareness, and emotional regulation',
  yoga: 'body-mind coordination, patience, and presence',
  music: 'pattern recognition, emotional sensitivity, and creative rhythm',
  writ: 'clarity of thought, narrative structure, and precise communication',
  cod: 'systematic problem decomposition and logical thinking',
  design: 'spatial thinking, aesthetic judgment, and user empathy',
  teach: 'clear communication, empathy, and the ability to simplify complexity',
  speak: 'confident presence, audience reading, and persuasion',
  business: 'systems thinking, resource allocation, and opportunity sensing',
  psycholog: 'behavioural insight, empathy, and understanding motivation',
  philosoph: 'structured reasoning, questioning assumptions, and first-principles thinking',
  sport: 'discipline, resilience, competitive focus, and team coordination',
  cook: 'experimentation, precision, and multisensory awareness',
  travel: 'adaptability, cross-cultural perspective, and comfort with uncertainty',
  financ: 'pattern recognition in complex systems and long-term thinking',
  market: 'persuasion, trend sensing, and empathy at scale',
  leader: 'vision-setting, influence without authority, and navigating ambiguity',
  art: 'creative expression, non-linear thinking, and emotional translation',
  read: 'broad knowledge synthesis and ability to learn from others\' experience',
  fitnes: 'discipline, body awareness, and sustained effort under discomfort',
};

export const PLACEHOLDERS = [
  'e.g. Meditation',
  'e.g. Speaking to people',
  'e.g. Music',
  'e.g. Writing',
  'e.g. Building things',
  'e.g. Psychology',
  'e.g. Business strategy',
  'e.g. Design',
  'e.g. Teaching',
  'e.g. Fitness'
];
