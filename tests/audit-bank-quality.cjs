const fs = require('node:fs');
const vm = require('node:vm');

const tracks = ['geo', 'jhist', 'whist', 'ethics', 'politics', 'integrated'];
const categories = ['people', 'laws', 'timeline', 'sequence'];
const context = vm.createContext({});
for (const file of ['bank-data.js', ...tracks.map(track => `bank-data-${track}.js`)]) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
const bank = vm.runInContext('JSON.parse(JSON.stringify(BANK))', context);
let total = 0;
let flagged = 0;
for (const track of tracks) {
  for (const category of categories) {
    const items = bank[track]?.[category] ?? [];
    const suspicious = items.filter(item =>
      item.some(value => typeof value === 'string' && /…|\.{3,}/u.test(value))
    );
    const malformed = items.filter(item =>
      item.some(value => typeof value === 'string' && /[。！？]{2,}/u.test(value))
    );
    const titles = items.map(item => item[0]).filter(value => typeof value === 'string');
    const duplicateTitles = titles.length - new Set(titles).size;
    total += items.length;
    flagged += suspicious.length;
    if (suspicious.length || malformed.length || duplicateTitles) {
      console.log(
        `REVIEW ${track}.${category}: ${suspicious.length} ellipsis/truncation candidates, ` +
        `${malformed.length} repeated punctuation, ${duplicateTitles} duplicate titles`
      );
    } else {
      console.log(`OK ${track}.${category}: no heuristic flags`);
    }
  }
}
console.log(`Quality audit complete: ${total} records; ${flagged} records contain ellipsis/truncation markers.`);
console.log('This is a heuristic review report, not a factual accuracy proof.');
