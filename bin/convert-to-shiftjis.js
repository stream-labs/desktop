const fs = require('fs');
const iconv = require('iconv-lite');

process.argv.slice(2).forEach((value, index, array) => {
    fs.createReadStream(value)
        .pipe(iconv.decodeStream('utf8'))
        .pipe(iconv.encodeStream('cp932'))
        .pipe(fs.createWriteStream(value + '.sjis'));
});

