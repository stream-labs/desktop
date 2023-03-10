import { Component } from 'vue-property-decorator';
import ReactComponent from './ReactComponent';

@Component({ props: { name: { default: 'AddSource' } } })
export class AddSource extends ReactComponent {}

@Component({ props: { name: { default: 'AdvancedAudio' } } })
export class AdvancedAudio extends ReactComponent {}

@Component({ props: { name: { default: 'AdvancedStatistics' } } })
export class AdvancedStatistics extends ReactComponent {}

@Component({ props: { name: { default: 'AlertboxLibrary' } } })
export class AlertboxLibrary extends ReactComponent {}

@Component({ props: { name: { default: 'Blank' } } })
export class Blank extends ReactComponent {}

@Component({ props: { name: { default: 'BrowseOverlays' } } })
export class BrowseOverlays extends ReactComponent {}

@Component({ props: { name: { default: 'Browser' } } })
export class Browser extends ReactComponent {}

@Component({
  props: {
    name: { default: 'BrowserView' },
    componentProps: { default: () => ({ src: '' }) },
  },
})
export class BrowserView extends ReactComponent {}

@Component({
  props: {
    name: { default: 'Chat' },
    componentProps: { default: () => ({ restream: false }) },
    wrapperStyles: {
      default: () => ({ height: '100%', display: 'flex', flexDirection: 'column' }),
    },
  },
})
export class Chat extends ReactComponent {}

@Component({
  props: {
    name: { default: 'Display' },
    componentProps: {
      default: () => ({
        paddingSize: 0,
        drawUI: false,
      }),
    },
  },
})
export class Display extends ReactComponent {}

@Component({
  props: {
    name: { default: 'DisplayElement' },
    mins: { default: () => ({ x: 0, y: 0 }) },
  },
})
export class DisplayElement extends ReactComponent {}

@Component({ props: { name: { default: 'EditStreamWindow' } } })
export class EditStreamWindow extends ReactComponent {}

@Component({ props: { name: { default: 'EditTransform' } } })
export class EditTransform extends ReactComponent {}

@Component({ props: { name: { default: 'FeedbackWindow' } } })
export class FeedbackWindow extends ReactComponent {}

@Component({
  props: {
    name: { default: 'GoLiveWindow' },
  },
})
export class GoLiveWindow extends ReactComponent {}

@Component({
  props: {
    name: { default: 'Grow' },
    wrapperStyles: { default: () => ({ gridRow: '1 / span 1' }) },
  },
})
export class Grow extends ReactComponent {}

@Component({ props: { name: { default: 'GuestCamProperties' } } })
export class GuestCamProperties extends ReactComponent {}

@Component({ props: { name: { default: 'Highlighter' } } })
export class Highlighter extends ReactComponent {}

@Component({ props: { name: { default: 'LayoutEditor' } } })
export class LayoutEditor extends ReactComponent {}

@Component({ props: { name: { default: 'Loader' } } })
export class Loader extends ReactComponent {}

@Component({ props: { name: { default: 'IconLibraryProperties' } } })
export class IconLibraryProperties extends ReactComponent {}

@Component({ props: { name: { default: 'InstalledApps' } } })
export class InstalledApps extends ReactComponent {}

@Component({
  props: {
    name: { default: 'LegacyEvents' },
    componentProps: { default: () => ({ onPopout: () => {} }) },
    mins: { default: () => ({ x: 360, y: 150 }) },
  },
})
export class LegacyEvents extends ReactComponent {}

@Component({
  props: {
    name: { default: 'ManageSceneCollections' },
  },
})
export class ManageSceneCollections extends ReactComponent {}

@Component({ props: { name: { default: 'MediaGallery' } } })
export class MediaGallery extends ReactComponent {}

@Component({
  props: {
    name: { default: 'MiniFeed' },
    mins: { default: () => ({ x: 330, y: 90 }) },
  },
})
export class MiniFeed extends ReactComponent {}

@Component({ props: { name: { default: 'NameFolder' } } })
export class NameFolder extends ReactComponent {}

@Component({ props: { name: { default: 'NameScene' } } })
export class NameScene extends ReactComponent {}

@Component({ props: { name: { default: 'NotificationsArea' } } })
export class NotificationsArea extends ReactComponent {}

@Component({ props: { name: { default: 'NotificationsAndNews' } } })
export class NotificationsAndNews extends ReactComponent {}

@Component({
  props: {
    name: { default: 'ObsSettings' },
    componentProps: { default: () => ({ page: 'General' }) },
  },
})
export class ObsSettings extends ReactComponent {}

@Component({ props: { name: { default: 'Onboarding' } } })
export class Onboarding extends ReactComponent {}

@Component({ props: { name: { default: 'PatchNotes' } } })
export class PatchNotes extends ReactComponent {}

@Component({
  props: {
    name: { default: 'PerformanceMetrics' },
    componentProps: { default: () => ({ mode: 'limited' }) },
  },
})
export class PerformanceMetrics extends ReactComponent<{ mode: 'full' | 'limited' }> {}

@Component({ props: { name: { default: 'PlatformAppPageView' } } })
export class PlatformAppPageView extends ReactComponent {}

@Component({ props: { name: { default: 'PlatformAppMainPage' } } })
export class PlatformAppMainPage extends ReactComponent {}

@Component({
  props: { name: { default: 'PlatformAppPopOut' } },
})
export class PlatformAppPopOut extends ReactComponent {}

@Component({ props: { name: { default: 'PlatformAppStore' } } })
export class PlatformAppStore extends ReactComponent {}

@Component({ props: { name: { default: 'PlatformLogo' } } })
export class PlatformLogo extends ReactComponent<{
  platform: string;
  size?: 'medium' | number;
  color?: string;
  unwrapped?: boolean;
}> {}

@Component({ props: { name: { default: 'PlatformMerge' } } })
export class PlatformMerge extends ReactComponent {}

@Component({ props: { name: { default: 'Projector' } } })
export class Projector extends ReactComponent {}

@Component({
  props: {
    name: { default: 'RecentEvents' },
    componentProps: { default: () => ({ isOverlay: false }) },
  },
})
export class RecentEvents extends ReactComponent<{ isOverlay?: boolean }> {}

@Component({ props: { name: { default: 'RecentEventsWindow' } } })
export class RecentEventsWindow extends ReactComponent {}

@Component({ props: { name: { default: 'RecordingHistory' } } })
export class RecordingHistory extends ReactComponent {}

@Component({
  props: {
    name: { default: 'RecordingPreview' },
    mins: { default: () => ({ x: 0, y: 0 }) },
  },
})
export class RecordingPreview extends ReactComponent {}

@Component({ props: { name: { default: 'RenameSource' } } })
export class RenameSource extends ReactComponent {}

@Component({ props: { name: { default: 'SafeMode' } } })
export class SafeMode extends ReactComponent {}

@Component({
  props: {
    name: { default: 'StreamPreview' },
    mins: { default: () => ({ x: 0, y: 0 }) },
  },
})
export class StreamPreview extends ReactComponent {}

@Component({
  props: {
    name: { default: 'SceneSelector' },
    mins: { default: () => ({ x: 200, y: 120 }) },
  },
})
export class SceneSelector extends ReactComponent {}

@Component({
  props: {
    name: { default: 'SourceSelector' },
    mins: { default: () => ({ x: 200, y: 120 }) },
  },
})
export class SourceSelector extends ReactComponent {}

@Component({ props: { name: { default: 'SideNav' } } })
export class SideNav extends ReactComponent {}

@Component({ props: { name: { default: 'SourceProperties' } } })
export class SourceProperties extends ReactComponent {}

@Component({ props: { name: { default: 'ScreenCaptureProperties' } } })
export class ScreenCaptureProperties extends ReactComponent {}
@Component({ props: { name: { default: 'SharedComponentsLibrary' } } })
export class SharedComponentsLibrary extends ReactComponent {}

@Component({ props: { name: { default: 'SourceFilters' } } })
export class SourceFilters extends ReactComponent {}
@Component({ props: { name: { default: 'SourceShowcase' } } })
export class SourceShowcase extends ReactComponent {}

@Component({ props: { name: { default: 'StartStreamingButton' } } })
export class StartStreamingButton extends ReactComponent {}

@Component({ props: { name: { default: 'StreamScheduler' } } })
export class StreamScheduler extends ReactComponent {}

@Component({ props: { name: { default: 'StudioEditor' } } })
export class StudioEditor extends ReactComponent {}

@Component({
  props: {
    name: { default: 'StudioFooter' },
    wrapperStyles: {
      default: () => ({
        'grid-row': '2 / span 1',
        display: 'flex',
        'min-width': 0,
      }),
    },
  },
})
export class StudioFooter extends ReactComponent {}

@Component({
  props: {
    name: { default: 'TestWidgets' },
    componentProps: { default: () => ({ testers: null as string[] }) },
  },
})
export class TestWidgets extends ReactComponent<{ testers: string[] }> {}

@Component({ props: { name: { default: 'ThemeAudit' } } })
export class ThemeAudit extends ReactComponent {}

@Component({
  props: {
    name: { default: 'TitleBar' },
    componentProps: { default: () => ({ windowId: '' }) },
  },
})
export class TitleBar extends ReactComponent {}

@Component({ props: { name: { default: 'WelcomeToPrime' } } })
export class WelcomeToPrime extends ReactComponent {}

@Component({ props: { name: { default: 'WidgetWindow' } } })
export class WidgetWindow extends ReactComponent {}

@Component({ props: { name: { default: 'CustomCodeWindow' } } })
export class CustomCodeWindow extends ReactComponent {}

@Component({ props: { name: { default: 'NewBadge' } } })
export class NewBadge extends ReactComponent {}
@Component({ props: { name: { default: 'UltraIcon' } } })
export class UltraIcon extends ReactComponent<{
  type?: string;
  className?: string;
}> {}
