import { DefaultManager } from './default-manager';
import path from 'path';
import fs from 'fs';

export class IconLibraryManager extends DefaultManager {
  // saveLibrary(folderPath: string) {
  //   const prefix = this.obsSource.id;
  //   fs.readdir(folderPath, (err: Error, files: string[]) => {
  //     files.forEach(file => {
  //       const newFileName = `${prefix}-${uniqueId()}${path.parse(file).ext}`;
  //       // Copy the image file
  //       const destination = path.join(context.assetsPath, newFileName);
  //       fs.writeFileSync(destination, fs.readFileSync(filePath));
  //     })
  //   })
  // }
}
