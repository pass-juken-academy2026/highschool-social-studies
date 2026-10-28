const fs = require('node:fs');
const vm = require('node:vm');
const tracks = ["geo","jhist","whist","ethics","politics","integrated"];
const categories = ["people","laws","timeline","sequence"];
const context = vm.createContext({});
for (const file of ['bank-data.js', ...tracks.map(track => `bank-data-${track}.js`)]) vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
const bank = vm.runInContext('JSON.parse(JSON.stringify(BANK))', context);
let total = 0;
for (const track of tracks) for (const category of categories) {
  const items = bank[track]?.[category] ?? [];
  const titleIndex = category === 'timeline' ? 1 : 0;
  const titles = items.map(item => item[titleIndex]);
  const duplicateTitles = titles.length - new Set(titles).size;
  const duplicateRows = items.length - new Set(items.map(item => JSON.stringify(item))).size;
  const tagDuplicates = ['people', 'laws'].includes(category) ? items.filter(item => { const tags = String(item[3] || '').split('・').filter(Boolean); return tags.length !== new Set(tags).size; }).length : 0;
  const truncationFlags = items.filter(item => item.some(value => typeof value === 'string' && /…|\\.{3,}/u.test(value))).length;
  const punctuationFlags = items.filter(item => item.some(value => typeof value === 'string' && /[。！？]{2,}/u.test(value))).length;
  const repeatedSentenceRows = items.filter(item => item.some(value => {
    if (typeof value !== 'string') return false;
    const sentences = value.split(/[。！？]/u).map(part => part.trim()).filter(Boolean);
    return sentences.some((sentence, index) => sentences.indexOf(sentence) !== index);
  })).length;
  const selfComparisonRows = category === 'timeline' ? items.filter(item => {
    const parts = String(item[0] || '').split(/[・／/]/u).map(part => part.trim()).filter(Boolean);
    const normalize = value => value.normalize('NFKC').replace(/\\s+/gu, '');
    return parts.some((part, index) => parts.slice(index + 1).some(other => normalize(part) === normalize(other)));
  }).length : 0;
  const strayHazardTerms = category === 'sequence' ? items.filter(item => item.some(value => typeof value === 'string' && /\\bhazard\\b/i.test(value))).length : 0;
  total += items.length;
  if (duplicateTitles || duplicateRows || tagDuplicates || repeatedSentenceRows || selfComparisonRows || strayHazardTerms) {
    throw new Error(`${track}.${category}: quality check failed (duplicate title/row/tag, repeated sentence, self-comparison, or stray hazard term)`);
  }
  if (truncationFlags || punctuationFlags) console.log(`REVIEW ${track}.${category}: ${truncationFlags} truncation candidates, ${punctuationFlags} repeated-punctuation candidates`);
  else console.log(`OK ${track}.${category}: no duplicate, repeated-sentence, self-comparison, or formatting flags`);
}
console.log(`Quality audit complete: ${total} records checked. Existing unique content retained; repeated aliases/duplicate items consolidated.`);
