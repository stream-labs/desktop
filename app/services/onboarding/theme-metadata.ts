export interface IThemeMetadata {
  data: {
    id: number;
    name: string;
    custom_images: Dictionary<string>;
    designer: {
      name: string;
      avatar: string;
      website: string;
    };
  };
}

export const THEME_METADATA = {
  FREE: {
    2560: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0a2acb8/0a2acb8.overlay',
    2559: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/6dcbf5f/6dcbf5f.overlay',
    2624: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/eeeb9e1/eeeb9e1.overlay',
    2657: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/0697cee/0697cee.overlay',
    2656: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/59acc9a/59acc9a.overlay',
    2639: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/a1a4ab0/a1a4ab0.overlay',
  },
  PAID: {
    // Waves (paid version), free: 3216
    2183: 'https://cdn.streamlabs.com/marketplace/overlays/439338/8164789/8164789.overlay',
    // Esports Legacy (free)
    3010: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/30a5873/30a5873.overlay',
    // Scythe (paid version), free: 2561
    3287: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/de716b6/de716b6.overlay',
    // Neon Pixel (paid version), free: 2574
    1445: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/fdb4d16/fdb4d16.overlay',
    // Talon (paid version), free: 1207
    1289: 'https://cdn.streamlabs.com/marketplace/overlays/7684923/c5f35e1/c5f35e1.overlay',
    // Cyber Nights
    3872: 'https://cdn.streamlabs.com/marketplace/overlays/60327649/249fcfe/249fcfe.overlay',
  },
};
