const fs = require('node:fs');
const vm = require('node:vm');

const tracks = ['geo', 'jhist', 'whist', 'ethics', 'politics', 'integrated'];
const categories = ['people', 'laws', 'timeline', 'sequence'];
const expected = {
  geo: { people: 478, laws: 438, timeline: 461, sequence: 458 },
  jhist: { people: 492, laws: 442, timeline: 459, sequence: 459 },
  whist: { people: 500, laws: 452, timeline: 475, sequence: 459 },
  ethics: { people: 456, laws: 442, timeline: 461, sequence: 456 },
  politics: { people: 457, laws: 442, timeline: 458, sequence: 458 },
  integrated: { people: 467, laws: 459, timeline: 457, sequence: 462 },
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
