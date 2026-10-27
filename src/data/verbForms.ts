import type { IrregularVerb } from './irregularVerbs';
import type { RegularVerb } from './regularVerbs';

type VerbEntry = RegularVerb | IrregularVerb;

const participles: Record<string, string> = {
  arise: 'arisen', awake: 'awoken/awaked', be: 'been', bear: 'borne/born', beat: 'beaten', become: 'become', begin: 'begun',
  bite: 'bitten', blow: 'blown', break: 'broken', choose: 'chosen', come: 'come', do: 'done', draw: 'drawn',
  drink: 'drunk', drive: 'driven', eat: 'eaten', fall: 'fallen', fly: 'flown', forbid: 'forbidden', forget: 'forgotten',
  forgive: 'forgiven', freeze: 'frozen', get: 'gotten/got', give: 'given', go: 'gone', grow: 'grown', hide: 'hidden',
  know: 'known', lie: 'lain/lied', ride: 'ridden', ring: 'rung', rise: 'risen', see: 'seen', shake: 'shaken',
  show: 'shown/showed', shrink: 'shrunk', sing: 'sung', sink: 'sunk', speak: 'spoken', spring: 'sprung', steal: 'stolen',
  stink: 'stunk', swear: 'sworn', swim: 'swum', take: 'taken', tear: 'torn', throw: 'thrown', wake: 'woken',
  wear: 'worn', weave: 'woven', write: 'written', overcome: 'overcome', overtake: 'overtaken', partake: 'partaken',
  rewrite: 'rewritten', sow: 'sown', swell: 'swollen', tread: 'trodden', undergo: 'undergone',
  undertake: 'undertaken', undo: 'undone', unfreeze: 'unfrozen', wring: 'wrung',
};

export function pastParticiple(verb: VerbEntry) {
  return participles[verb.infinitive] ?? verb.pastSimple;
}
