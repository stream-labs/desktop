import sharp from 'sharp';
import fs from 'fs-extra';
import { IResolution } from '../subtitles/svg-creator';

export async function svgToPng(svgText: string, resolution: IResolution, outputPath: string) {
  try {
    const buffer = await sharp({
      // Generate PNG with transparent background
      create: {
        width: resolution.width,
        height: resolution.height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: Buffer.from(svgText),
          top: 0,
          left: 0,
        },
      ])
      .png()
      .toBuffer();

    console.log('Write svg to ', outputPath);
    await fs.writeFile(outputPath, buffer);
    console.log('Done');
  } catch (error: unknown) {
    console.error('Error creating PNG from SVG', error);
  }
}
