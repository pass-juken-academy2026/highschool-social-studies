const fs = require('node:fs');
const vm = require('node:vm');

const tracks = ['geo', 'jhist', 'whist', 'ethics', 'politics', 'integrated'];
const categories = ['people', 'laws', 'timeline', 'sequence'];
const expected = {
  geo: { people: 278, laws: 238, timeline: 261, sequence: 258 },
  jhist: { people: 292, laws: 242, timeline: 259, sequence: 259 },
  whist: { people: 300, laws: 252, timeline: 275, sequence: 259 },
  ethics: { people: 256, laws: 242, timeline: 261, sequence: 256 },
  politics: { people: 257, laws: 242, timeline: 258, sequence: 258 },
  integrated: { people: 267, laws: 259, timeline: 257, sequence: 262 },
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
