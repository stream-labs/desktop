import { Service } from './service';
import path from 'path';
import fs from 'fs';
import https from 'https';
import electron from 'electron';
import { EFontStyle } from 'obs-studio-node';

export interface IFamilyWithStyle {
  family: IFontFamily;
  style: IFontStyle;
}

export interface IFontStyle {
  name: string;
  file: string;
}

export interface IFontFamily {
  name: string;
  styles: IFontStyle[];
}


export interface IFontManifest {
  families: IFontFamily[];
}


export class FontLibraryService extends Service {


  private manifest: IFontManifest;


  getManifest(): Promise<IFontManifest> {
    if (!this.manifest) {
      const req = new Request(this.libraryUrl('manifest.json'));

      return fetch(req).then(response => {
        return response.json();
      }).then(json => {
        this.manifest = json;
        return json;
      }).catch(() => {
        return { families: [] };
      });
    }

    return Promise.resolve(this.manifest);
  }

  getSettingsFromFont(familyName: string, style: string): [string, number] {
    /* Scrape style string remnants onto actual family name
     * until we're left with nothing but plugin compatible terms. */
    const styleSplit = style.split(' ');
    let actualFamily = familyName;
    let actualStyle = 0;

    for (let i = 0; i < styleSplit.length; ++i) {
      switch (styleSplit[i]) {
        case 'Regular':
          if (i !== styleSplit.length - 1) {
            console.log(`Weird font style detected: ${style}`);
          }

          break;
        case 'Italic':
          if (i !== styleSplit.length - 1) {
            console.log(`Weird font style detected: ${style}`);
          }

          actualStyle |= EFontStyle.Italic;
          break;
        case 'Bold':
          actualStyle |= EFontStyle.Bold;
          break;
        default:
          actualFamily += ` ${styleSplit[i]}`;
      }
    }

    return [actualFamily, actualStyle];
  }

  /* This scans the entire manifest (which is slow)
   * to find a filename, then finds the family name
   * in the parent. This also doesn't take into account
   * font files yet. This function is used mostly for
   * upgrading config schema */
  findFontFile(baseFileName: string): Promise<IFamilyWithStyle> {
    return this.getManifest().then(manifest => {
      for (let i = 0; i < manifest.families.length; ++i) {
        const family = manifest.families[i];

        for (let k = 0; k < family.styles.length; ++k) {
          const style = family.styles[k];

          if (baseFileName === style.file) {
            return { family, style };
          }
        }
      }
    });
  }


  findFamily(family: string): Promise<IFontFamily> {
    return this.getManifest().then(manifest => {
      return manifest.families.find(fam => fam.name === family);
    });
  }


  findStyle(family: string, style: string): Promise<IFontStyle> {
    return this.findFamily(family).then(fam => {
      return fam.styles.find(sty => sty.name === style);
    });
  }


  // Finds family and style info about a given font path
  lookupFontInfo(fontPath: string): Promise<{ family: string, style: string }> {
    return this.getManifest().then(manifest => {
      let family: string;
      let style: string;

      const file = path.parse(fontPath).base;

      manifest.families.find(fam => {
        return !!fam.styles.find(sty => {
          if (sty.file === file) {
            family = fam.name;
            style = sty.name;

            return true;
          }
        });
      });

      return { family, style };
    });
  }


  // Returns a promise that resolves with a path to the downloaded font
  downloadFont(file: string): Promise<string> {
    const fontPath = this.libraryPath(file);

    // Don't re-download the font if we have already downloaded it
    if (fs.existsSync(fontPath)) {
      return Promise.resolve(fontPath);
    }

    return new Promise(resolve => {
      this.ensureFontsDirectory();

      https.get(this.libraryUrl(file), response => {
        const fontFile = fs.createWriteStream(fontPath);

        fontFile.on('finish', () => resolve(fontPath));
        response.pipe(fontFile);
      });
    });
  }


  private ensureFontsDirectory() {
    if (!fs.existsSync(this.fontsDirectory)) {
      fs.mkdirSync(this.fontsDirectory);
    }
  }


  private get fontsDirectory() {
    return path.join(electron.remote.app.getPath('userData'), 'Fonts');
  }


  // Create a local font library path from a filename
  private libraryPath(file: string) {
    return path.join(this.fontsDirectory, file);
  }


  // Create an s3 font library url from a filename
  private libraryUrl(file: string) {
    return `https://d1g6eog1uhe0xm.cloudfront.net/fonts/${file}`;
  }

}
