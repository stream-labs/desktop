/**
 * Run this script to find the strings that missed in localization dictionaries.
 */
const searchExp = /\$t\(\'([ a-zA-Z\d\-_`@%;:,'’=&!~#\\\+\*\?\.\}\{\(\)\[\]\$/]+)\'.*?\)/gm;
const fs = require('fs');
const recursive = require('recursive-readdir');


(async function main() {

  const dictionary = {};

  // load dictionary
  const dictionaryFiles = await recursive('./app/i18n/en-US', ['*.txt']);
  dictionaryFiles.forEach(filePath => {
    let fileDictionary;
    try {
      fileDictionary = JSON.parse(fs.readFileSync(filePath).toString());
    } catch (e) {
      console.log('parse error for', filePath);
      process.exit(1);
    }

    Object.assign(dictionary, fileDictionary);
  });

  const sourceFiles = await recursive('./app', ['*.txt']);

  // check missed strings in the sources files
  sourceFiles.forEach(filePath => {
    const foundStrings = [];
    const missedStrings = [];

    const fileContent = fs.readFileSync(filePath).toString();
    let match;
    while ((match = searchExp.exec(fileContent))) {
      let string = match[1];
      string = string.replace('\\', '');
      if (!foundStrings.includes(string)) foundStrings.push(string);
    }

    foundStrings.forEach(str => {
      if (dictionary[str] || missedStrings.includes(str)) return;
      missedStrings.push(str);
    });


    if (!missedStrings.length) return;

    console.log(`missed strings found in ${filePath}`);

    const missedStringsMap = {};
    missedStrings.forEach(missedString => {
      missedStringsMap[missedString] = missedString;
    });

    console.log(JSON.stringify(missedStringsMap, null, 4));
  });



})();





