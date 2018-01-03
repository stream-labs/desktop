const fs = require('fs');
const querystring = require('querystring');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
import { getConfigs } from 'utils';

const CONFIG = JSON.parse(fs.readFileSync('test/screentest/config.json'));
const branches = process.argv.slice(2, 4);
const [newBranchName, baseBranchName] = branches;

console.log('argv:', process.argv);
console.log('branches to compare:', branches);

const images = fs.readdirSync(`${CONFIG.dist}/${newBranchName}`);

interface IRegression {
  name: string;
  baseImage: string;
  branchImage: string;
  diffImage?: string;
  isChanged: boolean;
  isNew: boolean;
  params: Dictionary<any>;
}

interface IParsedImage {
  base: any;
  branch: any;
  diff: any;
}

const regressions: {[imageName: string]: IRegression} = {};
const parsedImages: {[imageName: string]: IParsedImage } = {};

(async function main() {

  if (!fs.existsSync(`${CONFIG.dist}/diff`)) fs.mkdirSync(`${CONFIG.dist}/diff`);

  const configs = getConfigs();

  console.log('read images...');

  await new Promise(resolve => {
    let parsedImagesCount = 0;

    const doneReading = (count: number) => {
      parsedImagesCount += count;
      if (parsedImagesCount / 2 === images.length) resolve();
    };

    for (const image of images) {
      const baseImage = `${CONFIG.dist}/${baseBranchName}/${image}`;
      const branchImage = `${CONFIG.dist}/${newBranchName}/${image}`;
      const diffImage = `${CONFIG.dist}/diff/${image}`;
      const isNew = !fs.existsSync(baseImage);
      const [name, restFileName] = image.split('__');
      const configInd = Number(restFileName.slice(0, -4));
      const params = configs[configInd];

      regressions[image] = {
        name,
        baseImage,
        branchImage,
        diffImage,
        isNew,
        params,
        isChanged: false
      };

      if (isNew) {
        doneReading(2);
      } else {
        parsedImages[image] = {
          base: fs.createReadStream(baseImage).pipe(new PNG()).on('parsed', () => doneReading(1)),
          branch: fs.createReadStream(branchImage).pipe(new PNG()).on('parsed', () => doneReading(1)),
          diff: null
        };
      }

    }
  });


  console.log('compare images...');
  for (const image of images) {
    const regression = regressions[image];
    if (regression.isNew) continue;

    const parsedImage = parsedImages[image];
    const baseImage = parsedImage.base;
    parsedImage.diff = new PNG({ width: baseImage.width, height: baseImage.height });

    const numDiffPixels = pixelmatch(
      parsedImage.base.data,
      parsedImage.branch.data,
      parsedImage.diff.data,
      baseImage.width,
      baseImage.height,
      { threshold: 0.1 }
    );

    regression.isChanged = numDiffPixels > 0;
    parsedImage.diff.pack().pipe(fs.createWriteStream(regression.diffImage));
  }

  console.log('regressions', regressions);

})();
