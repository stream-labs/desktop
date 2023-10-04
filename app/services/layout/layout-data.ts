import { $t } from 'services/i18n';

export enum ELayout {
  Default = 'Default',
  TwoPane = 'TwoPane',
  Classic = 'Classic',
  FourByFour = 'FourByFour',
  Triplets = 'Triplets',
  OnePane = 'OnePane',
  OnePaneR = 'OnePaneR',
  Pyramid = 'Pyramid',
}

export enum ELayoutElement {
  Minifeed = 'Minifeed',
  LegacyEvents = 'LegacyEvents',
  Display = 'Display',
  Mixer = 'Mixer',
  Scenes = 'Scenes',
  Sources = 'Sources',
  StreamPreview = 'StreamPreview',
  RecordingPreview = 'RecordingPreview',
  Browser = 'Browser',
}

type ILayoutData = {
  [Layout in ELayout]: {
    resizeDefaults: { bar1: number; bar2?: number };
    className: string;
    component: string;
  };
};

export const LAYOUT_DATA: ILayoutData = {
  [ELayout.Default]: {
    resizeDefaults: { bar1: 0.2, bar2: 0.3 },
    className: 'default',
    component: 'Default',
  },
  [ELayout.TwoPane]: {
    resizeDefaults: { bar1: 0.5, bar2: 0.3 },
    className: 'twoPane',
    component: 'Default',
  },
  [ELayout.Classic]: {
    resizeDefaults: { bar1: 0.4 },
    className: 'classic',
    component: 'Classic',
  },
  [ELayout.FourByFour]: {
    resizeDefaults: { bar1: 0.25, bar2: 0.25 },
    className: 'fourByFour',
    component: 'Default',
  },
  [ELayout.Triplets]: {
    resizeDefaults: { bar1: 0.6, bar2: 0.3 },
    className: 'triplets',
    component: 'Default',
  },
  [ELayout.OnePane]: {
    resizeDefaults: { bar1: 0.7 },
    className: 'onePane',
    component: 'Default',
  },
  [ELayout.OnePaneR]: {
    resizeDefaults: { bar1: 0.3 },
    className: 'onePaneR',
    component: 'Default',
  },
  [ELayout.Pyramid]: {
    resizeDefaults: { bar1: 0.4 },
    className: 'pyramid',
    component: 'Default',
  },
};

type IElementData = {
  [Element in ELayoutElement]: {
    title: string;
    component: string;
  };
};

export const ELEMENT_DATA = (): IElementData => ({
  [ELayoutElement.Display]: {
    title: $t('Editor Display'),
    component: 'Display',
  },
  [ELayoutElement.Minifeed]: {
    title: $t('Mini Feed'),
    component: 'MiniFeed',
  },
  [ELayoutElement.Mixer]: {
    title: $t('Audio Mixer'),
    component: 'Mixer',
  },
  [ELayoutElement.Scenes]: {
    title: $t('Scene Selector'),
    component: 'SceneSelectorElement',
  },
  [ELayoutElement.Sources]: {
    title: $t('Source Selector'),
    component: 'SourceSelectorElement',
  },
  [ELayoutElement.LegacyEvents]: {
    title: $t('Legacy Events'),
    component: 'LegacyEvents',
  },
  [ELayoutElement.StreamPreview]: {
    title: $t('Stream Preview'),
    component: 'StreamPreview',
  },
  [ELayoutElement.RecordingPreview]: {
    title: $t('Recording Preview'),
    component: 'RecordingPreview',
  },
  [ELayoutElement.Browser]: {
    title: $t('Website'),
    component: 'Browser',
  },
});
