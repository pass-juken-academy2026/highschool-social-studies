const fs = require('node:fs');
const vm = require('node:vm');

const tracks = ["geo","jhist","whist","ethics","politics","integrated"];
const categories = ["people","laws","timeline","sequence"];
const expected = {
  "geo": {
    "people": 275,
    "laws": 237,
    "timeline": 260,
    "sequence": 258
  },
  "jhist": {
    "people": 292,
    "laws": 241,
    "timeline": 258,
    "sequence": 259
  },
  "whist": {
    "people": 299,
    "laws": 252,
    "timeline": 274,
    "sequence": 259
  },
  "ethics": {
    "people": 252,
    "laws": 242,
    "timeline": 260,
    "sequence": 256
  },
  "politics": {
    "people": 253,
    "laws": 242,
    "timeline": 257,
    "sequence": 258
  },
  "integrated": {
    "people": 266,
    "laws": 258,
    "timeline": 257,
    "sequence": 262
  }
};
const generatedExpected = {
  "geo": {
    "people": 208,
    "laws": 200,
    "timeline": 200,
    "sequence": 200
  },
  "jhist": {
    "people": 208,
    "laws": 200,
    "timeline": 200,
    "sequence": 200
  },
  "whist": {
    "people": 208,
    "laws": 200,
    "timeline": 200,
    "sequence": 200
  },
  "ethics": {
    "people": 208,
    "laws": 200,
    "timeline": 200,
    "sequence": 200
  },
  "politics": {
    "people": 208,
    "laws": 200,
    "timeline": 200,
    "sequence": 200
  },
  "integrated": {
    "people": 208,
    "laws": 200,
    "timeline": 200,
    "sequence": 200
  }
};
const context = vm.createContext({});
for (const file of ['bank-data.js', ...tracks.map(track => `bank-data-${track}.js`)]) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
}
const bank = vm.runInContext('JSON.parse(JSON.stringify(BANK))', context);
for (const track of tracks) {
  if (!Array.isArray(bank[track]?.questions)) throw new Error(`${track}: question bank was not initialized`);
  for (const category of categories) {
    const items = bank[track]?.[category] ?? [];
    if (items.length !== expected[track][category]) throw new Error(`${track}.${category}: expected ${expected[track][category]} entries, found ${items.length}`);
    const titleIndex = category === 'timeline' ? 1 : 0;
    const titles = items.map(item => item[titleIndex]);
    if (titles.length !== new Set(titles).size) throw new Error(`${track}.${category}: duplicate titles detected`);
    if (items.length !== new Set(items.map(item => JSON.stringify(item))).size) throw new Error(`${track}.${category}: duplicate rows detected`);
    const expectedLength = ['people', 'laws'].includes(category) ? 4 : 3;
    if (items.some(item => item.length !== expectedLength)) throw new Error(`${track}.${category}: malformed row shape`);
    if (['people', 'laws'].includes(category)) {
      for (const item of items) {
        const tags = String(item[3] || '').split('・').filter(Boolean);
        if (tags.length !== new Set(tags).size) throw new Error(`${track}.${category}: duplicate tag in ${item[0]}`);
      }
    }
    const prefix = category === 'people' ? '比較演習：' : category === 'laws' ? '制度比較：' : category === 'timeline' ? '比較：' : '手順比較：';
    const generated = items.filter(item => String(item[titleIndex] || '').startsWith(prefix)).length;
    if (generated !== generatedExpected[track][category]) throw new Error(`${track}.${category}: expected ${generatedExpected[track][category]} comparison entries, found ${generated}`);
    console.log(`${track}.${category}: ${items.length} entries; ${generated} comparison entries OK`);
  }
}
console.log('All 24 study banks validated: exactly 200 new comparison entries per category, no duplicate titles/rows/tags.');
