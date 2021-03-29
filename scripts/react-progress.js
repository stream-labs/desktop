/**
 * show the progress of react migration
 */
const glob = require('glob');

const migratedFiles = glob
  .sync('app/components-react/**/*.ts')
  .concat(glob.sync('app/components-react/**/*.tsx'));

const allFiles = glob.sync('app/components/**/*.ts').concat(glob.sync('app/components/**/*.tsx'));

const duplicatedFiles = migratedFiles.filter(file => {
  const fileName = file.match(/.*\/(.*).tsx?$/);
  const found = allFiles.find(file => file.match(fileName[1]));
  return found;
});

const progress = (migratedFiles.length - duplicatedFiles.length / 2) / allFiles.length;
const scale = 30;
const barsCount = Math.round(progress * scale);

console.log('\n\nReact migration progress');
console.log(
  `[${'#'.repeat(barsCount)}${'-'.repeat(scale - barsCount)}] ${Math.round(progress * 100)}%`,
);
console.log('migrated:', migratedFiles.length - duplicatedFiles.length / 2, 'files');
console.log('total:', allFiles.length, 'files');
