import sharp from 'sharp';

const SUBTITLE_PATH = 'C:/Users/jan/Videos/temp_subtitles/';
interface ITextItem {
  text: string;
  fontColor?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
}
async function generateStyledTextImage(textItems: ITextItem[]) {
  const width = 1280;
  const height = 720;

  // Build SVG with different text styles
  let svgText = `<svg width="${width}" height="${height}">`;

  // Calculate total width to center
  let totalWidth = 0;

  // First pass to calculate positions
  textItems.forEach(item => {
    // Approximate width for positioning - not perfect but works for basic centering
    const textWidth = item.text.length * (item.fontSize || 24 * 0.6);
    totalWidth += textWidth + 5; // 5px spacing
  });

  const position = 'bottom';
  const yPosition = position === 'bottom' ? height - 20 : height / 2;

  // Create a single text element with tspan children
  svgText += `
    <text 
      x="${width / 2}"
      y="${yPosition}"
      text-anchor="middle"
      dominant-baseline="middle"
    >`;

  // Calculate starting x position for the first tspan
  let currentX = (width - totalWidth) / 2;

  // Add tspan elements for each text item
  textItems.forEach(item => {
    const textWidth = item.text.length * (item.fontSize || 24 * 0.6);

    // Position tspan relative to the total text width
    svgText += `
      <tspan
        x="${currentX + textWidth / 2}"
        font-family="${item.fontFamily || 'sans'}"
        font-size="${item.fontSize || 24}px"
        font-weight="${item.fontWeight || 'normal'}"
        fill="${item.fontColor || '#ffffff'}"
      >${item.text}</tspan>`;

    currentX += textWidth + 5; // 5px spacing
  });

  // Close the text element
  svgText += `
    </text>
  </svg>`;

  const buffer = await sharp({
    // Generate PNG with transparent background
    create: {
      width,
      height,
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

  return buffer;
}

// Usage example
export async function saveStyledExample() {
  const textItems: ITextItem[] = [
    {
      text: 'Hello',
      fontColor: '#ff0000',
      fontSize: 32,
      fontWeight: 'bold',
    },
    {
      text: 'World',
      fontColor: '#0000ff',
      fontSize: 24,
    },
  ];

  const buffer = await generateStyledTextImage(textItems);
  await require('fs').promises.writeFile(SUBTITLE_PATH + 'styled-output.png', buffer);
}
