import React from 'react';
import * as Layouts from 'components-react/editor/layouts';
import * as Elements from 'components-react/editor/elements';
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
    component: (p: any) => React.ReactElement;
  };
};

export const LAYOUT_DATA: ILayoutData = {
  [ELayout.Default]: {
    resizeDefaults: { bar1: 0.2, bar2: 0.3 },
    className: 'default',
    component: Layouts.Default,
  },
  [ELayout.TwoPane]: {
    resizeDefaults: { bar1: 0.5, bar2: 0.3 },
    className: 'twoPane',
    component: Layouts.Default,
  },
  [ELayout.Classic]: {
    resizeDefaults: { bar1: 0.4 },
    className: 'classic',
    component: Layouts.Default,
  },
  [ELayout.FourByFour]: {
    resizeDefaults: { bar1: 0.25, bar2: 0.25 },
    className: 'fourByFour',
    component: Layouts.Default,
  },
  [ELayout.Triplets]: {
    resizeDefaults: { bar1: 0.6, bar2: 0.3 },
    className: 'triplets',
    component: Layouts.Default,
  },
  [ELayout.OnePane]: {
    resizeDefaults: { bar1: 0.7 },
    className: 'onePane',
    component: Layouts.Default,
  },
  [ELayout.OnePaneR]: {
    resizeDefaults: { bar1: 0.3 },
    className: 'onePaneR',
    component: Layouts.Default,
  },
  [ELayout.Pyramid]: {
    resizeDefaults: { bar1: 0.4 },
    className: 'pyramid',
    component: Layouts.Default,
  },
};

type IElementData = {
  [Element in ELayoutElement]: {
    title: string;
    component: (p: any) => React.ReactElement;
  };
};

export const ELEMENT_DATA = (): IElementData => ({
  [ELayoutElement.Display]: {
    title: $t('Editor Display'),
    component: Elements.Display,
  },
  [ELayoutElement.Minifeed]: {
    title: $t('Mini Feed'),
    component: Elements.MiniFeed,
  },
  [ELayoutElement.Mixer]: {
    title: $t('Audio Mixer'),
    component: Elements.Mixer,
  },
  [ELayoutElement.Scenes]: {
    title: $t('Scene Selector'),
    component: Elements.SceneSelector,
  },
  [ELayoutElement.Sources]: {
    title: $t('Source Selector'),
    component: Elements.SourceSelector,
  },
  [ELayoutElement.LegacyEvents]: {
    title: $t('Legacy Events'),
    component: Elements.LegacyEvents,
  },
  [ELayoutElement.StreamPreview]: {
    title: $t('Stream Preview'),
    component: Elements.StreamPreview,
  },
  [ELayoutElement.RecordingPreview]: {
    title: $t('Recording Preview'),
    component: Elements.RecordingPreview,
  },
  [ELayoutElement.Browser]: {
    title: $t('Website'),
    component: Elements.Browser,
  },
});
