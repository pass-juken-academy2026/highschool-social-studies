const fs = require('node:fs');
const vm = require('node:vm');

const tracks = ['geo', 'jhist', 'whist', 'ethics', 'politics', 'integrated'];
const categories = ['people', 'laws', 'timeline', 'sequence'];
const expected = {
  geo: { people: 678, laws: 638, timeline: 661, sequence: 658 },
  jhist: { people: 692, laws: 642, timeline: 659, sequence: 659 },
  whist: { people: 700, laws: 652, timeline: 675, sequence: 659 },
  ethics: { people: 656, laws: 642, timeline: 661, sequence: 656 },
  politics: { people: 657, laws: 642, timeline: 658, sequence: 658 },
  integrated: { people: 667, laws: 659, timeline: 657, sequence: 662 },
};

const context = vm.createContext({});
const files = ['bank-data.js', ...tracks.map(track => `bank-data-${track}.js`)];
for (const file of files) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
const bank = vm.runInContext('JSON.parse(JSON.stringify(BANK))', context);
for (const track of tracks) {
  for (const category of categories) {
    const actual = bank[track]?.[category]?.length;
    if (actual !== expected[track][category]) {
      throw new Error(`${track}.${category}: expected ${expected[track][category]}, found ${actual}`);
    }
    console.log(`${track}.${category}: ${actual} entries OK`);
  }
}
console.log('All 24 study banks validated.');
