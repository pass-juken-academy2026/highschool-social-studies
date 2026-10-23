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
const examples = [];
for (const track of tracks) {
  for (const category of categories) {
    const items = bank[track]?.[category] ?? [];
    const categoryMismatches = items.filter(item => {
      const title = typeof item[0] === 'string' ? item[0] : '';
      return (category === 'people' && /^(人物比較|制度比較|手順比較|比較演習)：/.test(title)) ||
        (category === 'laws' && /^(人物比較|手順比較)：/.test(title)) ||
        (category === 'sequence' && /^(人物比較|制度比較)：/.test(title));
    });
    const peopleComparisonTemplates = category === 'people'
      ? items.filter(item => typeof item[0] === 'string' && /^人物比較：/.test(item[0]))
      : [];
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
    for (const item of suspicious.slice(0, 3)) examples.push(`${track}.${category}: ${item[0]} | ${item.find(value => typeof value === 'string' && /…|\\.{3,}/u.test(value))}`);
    if (peopleComparisonTemplates.length) {
      console.log(
        `REVIEW ${track}.${category}: ${peopleComparisonTemplates.length} person-comparison template records; ` +
        `inspect whether both compared terms are actually people`
      );
      for (const item of peopleComparisonTemplates.slice(0, 3)) {
        console.log(`  person-comparison example: ${item[0]}`);
      }
    }
    if (suspicious.length || malformed.length || duplicateTitles || categoryMismatches.length) {
      console.log(
        `REVIEW ${track}.${category}: ${suspicious.length} ellipsis/truncation candidates, ` +
        `${malformed.length} repeated punctuation, ${duplicateTitles} duplicate titles, ${categoryMismatches.length} category-title mismatches`
      );
    } else {
      console.log(`OK ${track}.${category}: no heuristic flags`);
    }
  }
}
console.log(`Quality audit complete: ${total} records; ${flagged} records contain ellipsis/truncation markers.`);
console.log('Sample candidates (up to 3 per category):');
for (const example of examples) console.log(`  ${example}`);
console.log('Category-title mismatch counts above are heuristic and require human review.');
console.log('This is a heuristic review report, not a factual accuracy proof.');
