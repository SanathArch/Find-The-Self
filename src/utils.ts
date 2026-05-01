import { CORES } from './constants';

export function getCore(name: string): string {
  const k = Object.keys(CORES).find(c => name.toLowerCase().includes(c));
  return k ? CORES[k] : 'depth of focus, pattern recognition, and intrinsic drive';
}

export function makeComboDesc(a: string, b: string): string {
  const coreA = getCore(a);
  const coreB = getCore(b);
  const templates = [
    () => `Practising **${a}** builds ${coreA}. This is precisely what **${b}** quietly depends on to reach its highest expression. Most people who are great at ${b} spent years unknowingly training the same capacities through something like ${a}.`,
    () => `**${a}** and **${b}** share a hidden common ancestor: ${coreA.split(',')[0]}. This means the hours you invest in one are secretly paying dividends in the other. When you practise both intentionally, the compounding effect accelerates both faster than either alone.`,
    () => `The mental state that **${a}** develops — ${coreA.split(',')[0]} — is the exact inner environment that lets **${b}** flourish. Without that foundation, ${b} tends to plateau. With it, ${b} opens into territory most practitioners never reach.`,
    () => `**${b}** gives you a live testing ground for everything **${a}** trains. ${a} generates the insight; ${b} turns it into observable action. Together they form a feedback loop: one refines your inner world, the other stress-tests it in reality.`,
    () => `Here is what's unusual about having both **${a}** and **${b}**: ${coreA.split(',')[0]} — what ${a} gives you — is actually one of the rarest ingredients in people who are exceptional at ${b}. Most practitioners of ${b} never develop it. You already are.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)]();
}
