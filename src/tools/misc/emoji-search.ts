import { registry } from '../../core/registry';
import type { Tool } from '../../core/types';

// ~500 common emoji name→char mappings (inline, no external data file needed)
const EMOJI_DATA: Array<[string, string]> = [
  // Faces / Smileys
  ['grinning face', '😀'], ['grin', '😁'], ['joy', '😂'], ['rofl', '🤣'],
  ['smile', '😊'], ['blush', '😊'], ['relaxed', '☺️'], ['heart eyes', '😍'],
  ['kissing heart', '😘'], ['wink', '😉'], ['stuck out tongue', '😛'],
  ['thinking', '🤔'], ['zipper mouth', '🤐'], ['raised eyebrow', '🤨'],
  ['neutral face', '😐'], ['expressionless', '😑'], ['unamused', '😒'],
  ['roll eyes', '🙄'], ['grimacing', '😬'], ['lying face', '🤥'],
  ['relieved', '😌'], ['pensive', '😔'], ['sleepy', '😪'], ['drooling', '🤤'],
  ['sleeping', '😴'], ['mask', '😷'], ['thermometer face', '🤒'],
  ['bandage face', '🤕'], ['nauseated', '🤢'], ['sneezing', '🤧'],
  ['hot face', '🥵'], ['cold face', '🥶'], ['dizzy face', '😵'],
  ['exploding head', '🤯'], ['cowboy', '🤠'], ['partying', '🥳'],
  ['sunglasses', '😎'], ['nerd', '🤓'], ['monocle', '🧐'],
  ['confused', '😕'], ['worried', '😟'], ['slightly frowning', '🙁'],
  ['frowning face', '☹️'], ['open mouth', '😮'], ['hushed', '😯'],
  ['astonished', '😲'], ['flushed', '😳'], ['pleading', '🥺'],
  ['anguished', '😧'], ['fearful', '😨'], ['cold sweat', '😰'],
  ['disappointed relieved', '😥'], ['cry', '😢'], ['sob', '😭'],
  ['scream', '😱'], ['confounded', '😖'], ['persevere', '😣'],
  ['disappointed', '😞'], ['sweat', '😓'], ['weary', '😩'], ['tired', '😫'],
  ['yawning', '🥱'], ['triumph', '😤'], ['rage', '😡'], ['angry', '😠'],
  ['skull', '💀'], ['skull crossbones', '☠️'], ['pile of poo', '💩'],
  ['clown', '🤡'], ['japanese ogre', '👹'], ['japanese goblin', '👺'],
  ['ghost', '👻'], ['alien', '👽'], ['robot', '🤖'], ['cat smile', '😺'],
  // Hand gestures
  ['wave', '👋'], ['raised back hand', '🤚'], ['hand', '✋'], ['vulcan', '🖖'],
  ['ok hand', '👌'], ['pinched fingers', '🤌'], ['pinching hand', '🤏'],
  ['crossed fingers', '🤞'], ['love you gesture', '🤟'], ['metal', '🤘'],
  ['call me', '🤙'], ['point left', '👈'], ['point right', '👉'],
  ['point up', '👆'], ['middle finger', '🖕'], ['point down', '👇'],
  ['index up', '☝️'], ['thumbs up', '👍'], ['thumbs down', '👎'],
  ['fist', '✊'], ['oncoming fist', '👊'], ['left fist', '🤛'],
  ['right fist', '🤜'], ['clap', '👏'], ['raised hands', '🙌'],
  ['open hands', '👐'], ['pray', '🙏'], ['handshake', '🤝'],
  ['writing hand', '✍️'], ['nail polish', '💅'], ['selfie', '🤳'],
  ['muscle', '💪'], ['ear', '👂'], ['nose', '👃'], ['eyes', '👀'],
  ['eye', '👁️'], ['tongue', '👅'], ['lips', '👄'], ['brain', '🧠'],
  // People
  ['baby', '👶'], ['child', '🧒'], ['boy', '👦'], ['girl', '👧'],
  ['man', '👨'], ['woman', '👩'], ['old man', '👴'], ['old woman', '👵'],
  ['person', '🧑'], ['blond person', '👱'], ['beard', '🧔'],
  ['police', '👮'], ['construction worker', '👷'], ['guard', '💂'],
  ['detective', '🕵️'], ['doctor', '👨‍⚕️'], ['nurse', '👩‍⚕️'],
  ['teacher', '👨‍🏫'], ['student', '👨‍🎓'], ['scientist', '👨‍🔬'],
  ['astronaut', '👨‍🚀'], ['firefighter', '👨‍🚒'], ['mechanic', '🧑‍🔧'],
  ['cook', '🧑‍🍳'], ['artist', '🧑‍🎨'], ['pilot', '🧑‍✈️'],
  ['farmer', '🧑‍🌾'], ['zombie', '🧟'], ['vampire', '🧛'],
  ['mermaid', '🧜'], ['fairy', '🧚'], ['elf', '🧝'],
  // Hearts and symbols
  ['heart', '❤️'], ['orange heart', '🧡'], ['yellow heart', '💛'],
  ['green heart', '💚'], ['blue heart', '💙'], ['purple heart', '💜'],
  ['black heart', '🖤'], ['white heart', '🤍'], ['brown heart', '🤎'],
  ['broken heart', '💔'], ['heart exclamation', '❣️'], ['two hearts', '💕'],
  ['revolving hearts', '💞'], ['heart decoration', '💟'], ['peace', '☮️'],
  ['cross', '✝️'], ['star of david', '✡️'], ['sparkles', '✨'],
  ['eight pointed star', '✴️'], ['fire', '🔥'], ['100', '💯'],
  ['checkmark', '✅'], ['cross mark', '❌'], ['exclamation', '❗'],
  ['question', '❓'], ['warning', '⚠️'], ['zzz', '💤'],
  // Animals
  ['dog', '🐶'], ['cat', '🐱'], ['mouse', '🐭'], ['hamster', '🐹'],
  ['rabbit', '🐰'], ['fox', '🦊'], ['bear', '🐻'], ['panda', '🐼'],
  ['koala', '🐨'], ['tiger', '🐯'], ['lion', '🦁'], ['cow', '🐮'],
  ['pig', '🐷'], ['pig nose', '🐽'], ['frog', '🐸'], ['monkey', '🐵'],
  ['see no evil', '🙈'], ['hear no evil', '🙉'], ['speak no evil', '🙊'],
  ['chicken', '🐔'], ['penguin', '🐧'], ['bird', '🐦'], ['duck', '🐥'],
  ['eagle', '🦅'], ['owl', '🦉'], ['bat', '🦇'], ['wolf', '🐺'],
  ['boar', '🐗'], ['horse', '🐴'], ['unicorn', '🦄'], ['bee', '🐝'],
  ['bug', '🐛'], ['butterfly', '🦋'], ['snail', '🐌'], ['shell', '🐚'],
  ['ladybug', '🐞'], ['ant', '🐜'], ['mosquito', '🦟'], ['cricket', '🦗'],
  ['spider', '🕷️'], ['scorpion', '🦂'], ['turtle', '🐢'], ['snake', '🐍'],
  ['dragon face', '🐲'], ['dragon', '🐉'], ['sauropod', '🦕'],
  ['t-rex', '🦖'], ['whale', '🐳'], ['dolphin', '🐬'], ['fish', '🐟'],
  ['tropical fish', '🐠'], ['blowfish', '🐡'], ['shark', '🦈'],
  ['octopus', '🐙'], ['crab', '🦀'], ['lobster', '🦞'], ['shrimp', '🦐'],
  ['squid', '🦑'], ['snail', '🐌'], ['lion', '🦁'], ['ox', '🐂'],
  ['water buffalo', '🐃'], ['elephant', '🐘'], ['mammoth', '🦣'],
  ['rhino', '🦏'], ['hippo', '🦛'], ['mouse', '🐭'], ['rat', '🐀'],
  ['chipmunk', '🐿️'], ['hedgehog', '🦔'], ['moose', '🫎'],
  ['goat', '🐐'], ['sheep', '🐑'], ['camel', '🐫'], ['llama', '🦙'],
  ['giraffe', '🦒'], ['zebra', '🦓'], ['gorilla', '🦍'], ['orangutan', '🦧'],
  ['sloth', '🦥'], ['otter', '🦦'], ['skunk', '🦨'], ['kangaroo', '🦘'],
  ['badger', '🦡'], ['peacock', '🦚'], ['parrot', '🦜'], ['flamingo', '🦩'],
  ['swan', '🦢'], ['turkey', '🦃'], ['panda', '🐼'], ['polar bear', '🐻‍❄️'],
  // Food
  ['apple', '🍎'], ['pear', '🍐'], ['tangerine', '🍊'], ['lemon', '🍋'],
  ['banana', '🍌'], ['watermelon', '🍉'], ['grapes', '🍇'], ['strawberry', '🍓'],
  ['blueberries', '🫐'], ['melon', '🍈'], ['cherries', '🍒'],
  ['peach', '🍑'], ['mango', '🥭'], ['pineapple', '🍍'], ['coconut', '🥥'],
  ['kiwi', '🥝'], ['tomato', '🍅'], ['eggplant', '🍆'], ['avocado', '🥑'],
  ['broccoli', '🥦'], ['carrot', '🥕'], ['corn', '🌽'], ['hot pepper', '🌶️'],
  ['cucumber', '🥒'], ['lettuce', '🥬'], ['garlic', '🧄'], ['onion', '🧅'],
  ['mushroom', '🍄'], ['potato', '🥔'], ['sweet potato', '🍠'],
  ['pretzel', '🥨'], ['bagel', '🥯'], ['bread', '🍞'], ['baguette', '🥖'],
  ['waffle', '🧇'], ['cheese', '🧀'], ['egg', '🥚'], ['cooking', '🍳'],
  ['pancakes', '🥞'], ['butter', '🧈'], ['bacon', '🥓'], ['cut of meat', '🥩'],
  ['poultry leg', '🍗'], ['meat on bone', '🍖'], ['hotdog', '🌭'],
  ['hamburger', '🍔'], ['fries', '🍟'], ['pizza', '🍕'], ['sandwich', '🥪'],
  ['taco', '🌮'], ['burrito', '🌯'], ['sushi', '🍣'], ['fried shrimp', '🍤'],
  ['rice ball', '🍙'], ['rice', '🍚'], ['curry', '🍛'], ['noodles', '🍜'],
  ['spaghetti', '🍝'], ['fried rice', '🍚'], ['bento', '🍱'],
  ['dumpling', '🥟'], ['fortune cookie', '🥠'], ['moon cake', '🥮'],
  ['ice cream', '🍦'], ['ice cream sundae', '🍨'], ['cake', '🎂'],
  ['birthday cake', '🍰'], ['cupcake', '🧁'], ['pie', '🥧'],
  ['chocolate', '🍫'], ['candy', '🍬'], ['lollipop', '🍭'], ['honey', '🍯'],
  ['coffee', '☕'], ['teacup', '🍵'], ['bubble tea', '🧋'], ['beer', '🍺'],
  ['beers', '🍻'], ['wine glass', '🍷'], ['cocktail', '🍸'], ['champagne', '🍾'],
  ['milk', '🥛'], ['water', '💧'], ['juice', '🧃'], ['cup', '🥤'],
  // Activities & Sports
  ['soccer', '⚽'], ['basketball', '🏀'], ['football', '🏈'],
  ['baseball', '⚾'], ['softball', '🥎'], ['tennis', '🎾'],
  ['volleyball', '🏐'], ['rugby', '🏉'], ['frisbee', '🥏'],
  ['badminton', '🏸'], ['ping pong', '🏓'], ['hockey', '🏒'],
  ['skating', '⛸️'], ['ski', '⛷️'], ['snowboard', '🏂'],
  ['swimming', '🏊'], ['surfing', '🏄'], ['rowing', '🚣'],
  ['climbing', '🧗'], ['cycling', '🚴'], ['running', '🏃'],
  ['walking', '🚶'], ['golf', '⛳'], ['fishing', '🎣'],
  ['boxing', '🥊'], ['martial arts', '🥋'], ['wrestling', '🤼'],
  ['weightlifting', '🏋️'], ['gymnastics', '🤸'], ['medal', '🏅'],
  ['trophy', '🏆'], ['target', '🎯'], ['game controller', '🎮'],
  // Travel & Places
  ['car', '🚗'], ['taxi', '🚕'], ['bus', '🚌'], ['trolleybus', '🚎'],
  ['racing car', '🏎️'], ['police car', '🚓'], ['ambulance', '🚑'],
  ['fire truck', '🚒'], ['van', '🚐'], ['truck', '🚚'], ['truck cabin', '🚛'],
  ['tractor', '🚜'], ['motorcycle', '🏍️'], ['bicycle', '🚲'],
  ['scooter', '🛴'], ['electric scooter', '🛵'], ['skateboard', '🛹'],
  ['bus stop', '🚏'], ['fuel pump', '⛽'], ['train', '🚆'],
  ['bullet train', '🚄'], ['metro', '🚇'], ['station', '🚉'],
  ['airplane', '✈️'], ['rocket', '🚀'], ['flying saucer', '🛸'],
  ['satellite', '🛰️'], ['helicopter', '🚁'], ['boat', '⛵'],
  ['ship', '🚢'], ['ferry', '⛴️'], ['speedboat', '🚤'],
  ['anchor', '⚓'], ['construction', '🚧'], ['fuelpump', '⛽'],
  ['house', '🏠'], ['houses', '🏘️'], ['office', '🏢'],
  ['hospital', '🏥'], ['school', '🏫'], ['convenience store', '🏪'],
  ['hotel', '🏨'], ['castle', '🏰'], ['stadium', '🏟️'],
  ['beach', '🏖️'], ['mountain', '⛰️'], ['volcano', '🌋'],
  ['desert', '🏜️'], ['national park', '🏞️'], ['city sunrise', '🌇'],
  ['city at night', '🌃'], ['bridge', '🌉'], ['foggy', '🌁'],
  ['rainbow', '🌈'], ['sun', '☀️'], ['moon', '🌙'], ['star', '⭐'],
  ['cloud', '☁️'], ['rain', '🌧️'], ['lightning', '⚡'], ['snow', '❄️'],
  ['snowman', '☃️'], ['tornado', '🌪️'], ['fog', '🌫️'], ['wind', '🌬️'],
  // Objects
  ['watch', '⌚'], ['phone', '📱'], ['mobile phone', '📱'],
  ['computer', '💻'], ['desktop', '🖥️'], ['keyboard', '⌨️'],
  ['mouse', '🖱️'], ['printer', '🖨️'], ['tv', '📺'],
  ['camera', '📷'], ['video camera', '📹'], ['film projector', '📽️'],
  ['clapper board', '🎬'], ['telephone', '☎️'], ['pager', '📟'],
  ['fax', '📠'], ['battery', '🔋'], ['electric plug', '🔌'],
  ['bulb', '💡'], ['flashlight', '🔦'], ['candle', '🕯️'],
  ['money bag', '💰'], ['coin', '🪙'], ['credit card', '💳'],
  ['chart', '📈'], ['chart down', '📉'], ['bar chart', '📊'],
  ['clipboard', '📋'], ['calendar', '📅'], ['file folder', '📁'],
  ['open folder', '📂'], ['scroll', '📜'], ['page', '📄'],
  ['newspaper', '📰'], ['memo', '📝'], ['pencil', '✏️'],
  ['pen', '🖊️'], ['paintbrush', '🖌️'], ['crayon', '🖍️'],
  ['magnifying glass', '🔍'], ['scissors', '✂️'], ['paperclip', '📎'],
  ['ruler', '📏'], ['triangular ruler', '📐'], ['lock', '🔒'],
  ['unlock', '🔓'], ['key', '🔑'], ['hammer', '🔨'], ['wrench', '🔧'],
  ['screwdriver', '🪛'], ['gear', '⚙️'], ['chains', '⛓️'],
  ['gun', '🔫'], ['bomb', '💣'], ['knife', '🔪'], ['sword', '⚔️'],
  ['shield', '🛡️'], ['syringe', '💉'], ['pill', '💊'], ['microscope', '🔬'],
  ['telescope', '🔭'], ['satellite dish', '📡'], ['alarm clock', '⏰'],
  ['hourglass', '⌛'], ['hourglass flowing', '⏳'], ['stopwatch', '⏱️'],
  ['compass', '🧭'], ['thermometer', '🌡️'], ['umbrella', '☂️'],
  ['balloon', '🎈'], ['party popper', '🎉'], ['confetti', '🎊'],
  ['gift', '🎁'], ['ribbon', '🎀'], ['ticket', '🎟️'],
  ['crystal ball', '🔮'], ['dice', '🎲'], ['puzzle', '🧩'],
  ['chess', '♟️'], ['teddy bear', '🧸'], ['doll', '🪆'],
  // Symbols
  ['red circle', '🔴'], ['orange circle', '🟠'], ['yellow circle', '🟡'],
  ['green circle', '🟢'], ['blue circle', '🔵'], ['purple circle', '🟣'],
  ['brown circle', '🟤'], ['black circle', '⚫'], ['white circle', '⚪'],
  ['red square', '🟥'], ['orange square', '🟧'], ['yellow square', '🟨'],
  ['green square', '🟩'], ['blue square', '🟦'], ['purple square', '🟪'],
  ['brown square', '🟫'], ['black square', '⬛'], ['white square', '⬜'],
  ['stop sign', '🛑'], ['no entry', '⛔'], ['prohibited', '🚫'],
  ['recycle', '♻️'], ['fleur de lis', '⚜️'], ['trident', '🔱'],
  ['beginner', '🔰'], ['sparkle', '❇️'], ['copyright', '©️'],
  ['registered', '®️'], ['trademark', '™️'], ['hashtag', '#️⃣'],
  ['asterisk', '*️⃣'], ['information', 'ℹ️'], ['id button', '🆔'],
  ['new button', '🆕'], ['up button', '🆙'], ['cool button', '🆒'],
  ['free button', '🆓'], ['ng button', '🆖'], ['ok button', '🆗'],
  ['sos', '🆘'], ['end', '🔚'], ['back', '🔙'], ['on', '🔛'],
  ['top', '🔝'], ['soon', '🔜'], ['keycap 1', '1️⃣'], ['keycap 2', '2️⃣'],
  ['atm', '🏧'], ['cinema', '🎦'], ['signal strength', '📶'],
  ['kana chart', '🈁'], ['arrow up', '⬆️'], ['arrow down', '⬇️'],
  ['arrow left', '⬅️'], ['arrow right', '➡️'], ['back arrow', '🔙'],
  ['forward', '▶️'], ['rewind', '◀️'], ['shuffle', '🔀'], ['repeat', '🔁'],
  ['repeat one', '🔂'], ['fast forward', '⏩'], ['fast rewind', '⏪'],
  ['pause', '⏸️'], ['stop', '⏹️'], ['eject', '⏏️'],
];

function searchEmoji(query: string): Array<[string, string]> {
  const q = query.toLowerCase().trim();
  if (!q) return EMOJI_DATA.slice(0, 100);
  return EMOJI_DATA.filter(([name]) => name.includes(q));
}

const tool: Tool = {
  id: 'emoji-search',
  name: 'Emoji Search',
  description: 'Search ~500 common emojis by name and click to copy',
  category: 'misc',
  tags: ['emoji', 'search', 'copy', 'unicode', 'symbol', 'emoticon'],
  inputs: [
    {
      id: 'query',
      label: 'Search',
      type: 'text',
      placeholder: 'e.g. heart, fire, smile...',
      required: false,
    },
  ],
  options: [],
  output: { type: 'html' },
  apiSupported: false,

  async run(inputs) {
    const query = (inputs.query as string) ?? '';
    const results = searchEmoji(query);

    if (results.length === 0) {
      return { type: 'html', data: '<p>No emojis found. Try a different search term.</p>' };
    }

    const items = results.map(([name, char]) =>
      `<button class="emoji-item" title="${name}" onclick="navigator.clipboard.writeText('${char}').then(()=>{this.classList.add('copied');setTimeout(()=>this.classList.remove('copied'),1000)})">${char}</button>`
    ).join('');

    const html = `
<style>
.emoji-grid { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px; }
.emoji-item {
  font-size: 1.75rem; background: none; border: 1px solid transparent;
  border-radius: 6px; cursor: pointer; padding: 4px; transition: all 150ms;
  width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
}
.emoji-item:hover { background: #e9ecef; border-color: #dee2e6; }
.emoji-item.copied { background: #d3f9d8; border-color: #51cf66; }
.emoji-count { font-size: 0.8rem; color: #868e96; padding: 4px 8px; }
</style>
<div class="emoji-count">${results.length} emoji${results.length !== 1 ? 's' : ''} found — click to copy</div>
<div class="emoji-grid">${items}</div>`;

    return { type: 'html', data: html, summary: `${results.length} results for "${query || '(all)'}"` };
  },
};

registry.register(tool);
export default tool;
