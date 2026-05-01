import { Dimension, Path } from './types';

export const DIMS: Dimension[] = [
  { k: 'energy', l: 'Energy Audit', t: 'Does this soul-recharge (+10) or drain (1)?' },
  { k: 'skill', l: 'Competence', t: 'How naturally good are you at this?' },
  { k: 'leverage', l: 'Leverage', t: 'Can this scale? (Capital, Code, Content, Media)' },
  { k: 'longevity', l: 'Longevity', t: 'Will this matter in 10-20 years?' },
];

export const PATHS: Path[] = [
  { n: 'The Synthesis Alpha', d: 'The "Category of One". You combine high-leverage domains to create a unique monopoly of value.', w: { energy: 0.3, skill: 0.25, leverage: 0.25, longevity: 0.2 } },
  { n: 'The Chief Curator', d: 'Filters signal from noise in high-leverage fields. You profit from information scarcity.', w: { energy: 0.35, skill: 0.2, leverage: 0.2, longevity: 0.25 } },
  { n: 'The Scalable Builder', d: 'Uses code and content to automate insights. Thrives as a solo-capitalist.', w: { energy: 0.2, skill: 0.3, leverage: 0.35, longevity: 0.15 } },
  { n: 'The High-Value Bridge', d: 'Bridges technical leverage with human empathy. Indispensable in the AI era.', w: { energy: 0.2, skill: 0.3, leverage: 0.2, longevity: 0.3 } },
  { n: 'The Deep Practitioner', d: 'Masters the "bore to death" skills that others quit. Your discipline is your moate.', w: { energy: 0.3, skill: 0.25, leverage: 0.15, longevity: 0.3 } },
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
