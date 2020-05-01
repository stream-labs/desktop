/**
 * show the progress of strict-null migration
 */
const fs = require('fs');
const glob = require('glob');

// read all files eligible for the strictNulls checking
const filesPath = 'strict-null-check-files';
const files = fs.readdirSync(filesPath);
const migratedFilesPatterns = [];
files.forEach(file => {
  const json = JSON.parse(fs.readFileSync(`${filesPath}/${file}`));
  if (json.ts) migratedFilesPatterns.push(...json.ts);
  if (json.tsx) migratedFilesPatterns.push(...json.tsx);
});

const allFiles = glob.sync('app/**/*.ts').concat(glob.sync('app/**/*.tsx'));
let migratedFiles = [];
migratedFilesPatterns.forEach(pattern => {
  migratedFiles = migratedFiles.concat(glob.sync(pattern));
});

const allLines = allFiles
  .map(file => fs.readFileSync(file).toString().split('\n').length)
  .reduce((prev, curr) => prev + curr);

const migratedLines = migratedFiles
  .map(file => fs.readFileSync(file).toString().split('\n').length)
  .reduce((prev, curr) => prev + curr);

const progress = migratedLines / allLines;
const scale = 30;
const barsCount = Math.round(progress * scale);

console.log('\n\nStrict nulls migration progress');
console.log(`[${ '#'.repeat(barsCount) }${ '-'.repeat(scale - barsCount) }] ${ Math.round(progress * 100)}%`);
console.log('migrated:', migratedFiles.length, 'files', migratedLines, 'lines');
console.log('total:', allFiles.length, 'files', allLines, 'lines');
