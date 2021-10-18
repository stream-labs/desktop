import * as Layouts from 'components/editor/layouts';
import * as Elements from 'components/editor/elements';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';

export enum ELayout {
  // Default = 'Default',
  // TwoPane = 'TwoPane',
  Classic = 'Classic',
  // FourByFour = 'FourByFour',
  // Triplets = 'Triplets',
  OnePane = 'OnePane',
  OnePaneR = 'OnePaneR',
  Pyramid = 'Pyramid',
}

export enum ELayoutElement {
  // Minifeed = 'Minifeed',
  // LegacyEvents = 'LegacyEvents',
  Display = 'Display',
  Mixer = 'Mixer',
  Scenes = 'Scenes',
  Sources = 'Sources',
  // StreamPreview = 'StreamPreview',
  // RecordingPreview = 'RecordingPreview',
  // Browser = 'Browser',
  FlexTvChat = 'FlexTvChat',
}

type ILayoutData = {
  [Layout in ELayout]: {
    resizeDefaults: { bar1: number; bar2?: number };
    className: string;
    component: typeof TsxComponent;
  };
};

export const LAYOUT_DATA: ILayoutData = {
  [ELayout.Classic]: {
    resizeDefaults: { bar1: 0.4 },
    className: 'classic',
    component: Layouts.Classic,
  },
  [ELayout.OnePane]: {
    resizeDefaults: { bar1: 0.7 },
    className: 'onePane',
    component: Layouts.OnePane,
  },
  [ELayout.OnePaneR]: {
    resizeDefaults: { bar1: 0.3 },
    className: 'onePaneR',
    component: Layouts.OnePaneR,
  },
  [ELayout.Pyramid]: {
    resizeDefaults: { bar1: 0.4 },
    className: 'pyramid',
    component: Layouts.Pyramid,
  },
};

type IElementData = {
  [Element in ELayoutElement]: { title: string; component: typeof TsxComponent };
};

export const ELEMENT_DATA = (): IElementData => ({
  [ELayoutElement.Display]: { title: $t('Editor Display'), component: Elements.Display },
  // [ELayoutElement.Minifeed]: { title: $t('Mini Feed'), component: Elements.MiniFeed },
  [ELayoutElement.Mixer]: { title: $t('Audio Mixer'), component: Elements.Mixer },
  [ELayoutElement.Scenes]: { title: $t('Scene Selector'), component: Elements.SceneSelector },
  [ELayoutElement.Sources]: { title: $t('Source Selector'), component: Elements.SourceSelector },
  // [ELayoutElement.LegacyEvents]: { title: $t('Legacy Events'), component: Elements.LegacyEvents },
  // [ELayoutElement.StreamPreview]: {
  //   title: $t('Stream Preview'),
  //   component: Elements.StreamPreview,
  // },
  // [ELayoutElement.RecordingPreview]: {
  //   title: $t('Recording Preview'),
  //   component: Elements.RecordingPreview,
  // },
  // [ELayoutElement.Browser]: {
  //   title: $t('Website'),
  //   component: Elements.Browser,
  // },
  [ELayoutElement.FlexTvChat]: {
    title: '채팅',
    component: Elements.FlexTvChat,
  },
});
