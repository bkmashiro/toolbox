// Placeholder text styles for the placeholder text tool.

export interface PlaceholderStyle {
  id: string;
  label: string;
  words: string[];
}

export const PLACEHOLDER_STYLES: PlaceholderStyle[] = [
  {
    id: 'lorem',
    label: 'Classic Lorem Ipsum',
    words: `lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum curabitur pretium tincidunt lacus nulla gravida orci a odio nullam varius turpis eget arcu curabitur convallis sollicitudin urna sed augue laoreet vulputate diam`.split(' '),
  },
  {
    id: 'hipster',
    label: 'Hipster Ipsum',
    words: `artisan small batch brooklyn organic sustainable activated charcoal vinyl mixtape kombucha pickled letterpress twee ennui scenester narwhal palo santo whatever biodiesel pour-over selvage aesthetic mumblecore normcore chambray keffiyeh gastropub vaporware food truck crucifix locavore thundercats readymade tacos echo park flannel irony meggings umami bespoke glossier squid meh retro shaman fingerstache VSCO godard migas quinoa DIY chicharrones lumbersexual`.split(' '),
  },
  {
    id: 'corporate',
    label: 'Corporate Speak',
    words: `synergize leverage agile pivot scalable robust disruptive paradigm shift stakeholder alignment value proposition bandwidth onboarding circle back deep dive think outside the box actionable insights move the needle key performance indicator best practice thought leadership going forward bandwidth deliverable touch base boil the ocean holistic approach ideation robust pipeline synergy vertical integration proactive solutions game-changer strategic roadmap`.split(' '),
  },
  {
    id: 'pirate',
    label: 'Pirate Ipsum',
    words: `ahoy landlubber scallywag davy jones locker jolly roger black spot shiver me timbers walk the plank keelhaul corsair buccaneer privateer dead men tell no tales yo ho ho rum treasure chest doubloon cutlass swab the deck boatswain crow's nest mizzen mast starboard port fore aft bilge rat scupper grizzled sea dog marooned riptide mainsail hearty mutiny pillage plunder broadside cannonball siren whirlpool salty dog`.split(' '),
  },
  {
    id: 'medieval',
    label: 'Medieval Fantasy',
    words: `forsooth verily hark prithee ye olde knight dragon dungeon castle kingdom realm sorcerer enchantment quest goblin elf dwarf wizard potion scroll tavern blacksmith armor shield sword lance crossbow tournament herald maiden knave squire joust chivalry valor honor fealty siege trebuchet catapult moat drawbridge turret battlement rampart garrison`.split(' '),
  },
];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSentence(words: string[], minWords = 6, maxWords = 18): string {
  const len = minWords + Math.floor(Math.random() * (maxWords - minWords + 1));
  const chosen: string[] = [];
  for (let i = 0; i < len; i++) chosen.push(randomFrom(words));
  return capitalize(chosen.join(' ')) + '.';
}

function generateParagraph(words: string[], minSentences = 3, maxSentences = 7): string {
  const len = minSentences + Math.floor(Math.random() * (maxSentences - minSentences + 1));
  const sentences: string[] = [];
  for (let i = 0; i < len; i++) sentences.push(generateSentence(words));
  return sentences.join(' ');
}

export function generatePlaceholder(styleId: string, unit: 'paragraphs' | 'sentences' | 'words', count: number): string {
  const style = PLACEHOLDER_STYLES.find(s => s.id === styleId) ?? PLACEHOLDER_STYLES[0];
  const words = style.words;

  if (unit === 'words') {
    const result: string[] = [];
    for (let i = 0; i < count; i++) result.push(randomFrom(words));
    return capitalize(result.join(' ')) + '.';
  }

  if (unit === 'sentences') {
    const sentences: string[] = [];
    for (let i = 0; i < count; i++) sentences.push(generateSentence(words));
    return sentences.join(' ');
  }

  // paragraphs
  const paras: string[] = [];
  for (let i = 0; i < count; i++) paras.push(generateParagraph(words));
  return paras.join('\n\n');
}
