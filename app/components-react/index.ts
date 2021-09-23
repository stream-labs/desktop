import NameFolder from './windows/NameFolder';
import GoLiveWindow from './windows/go-live/GoLiveWindow';
import EditStreamWindow from './windows/go-live/EditStreamWindow';
import IconLibraryProperties from './windows/IconLibraryProperties';
import NewsBanner from './root/NewsBanner';
import PerformanceMetrics from './shared/PerformanceMetrics';
import PatchNotes from './pages/PatchNotes';
import Display from './shared/Display';
import TitleBar from './shared/TitleBar';
import Chat from './root/Chat';
import Highlighter from './pages/Highlighter';
import Grow from './pages/grow/Grow';
import Loader from './pages/Loader';
import NavTools from './sidebar/NavTools';
import PlatformLogo from './shared/PlatformLogo';
import AdvancedStatistics from './windows/AdvancedStatistics';
import StreamScheduler from './pages/stream-scheduler/StreamScheduler';
import { createRoot } from './root/ReactRoot';
import StartStreamingButton from './root/StartStreamingButton';
import TestWidgets from './root/TestWidgets';
import RenameSource from './windows/RenameSource';
import NotificationsArea from './root/NotificationsArea';
import AppsNav from './sidebar/AppsNav';
import StudioEditor from './root/StudioEditor';
import SharedComponentsLibrary from './windows/sharedComponentsLibrary/SharedComponentsLibrary';
import { ObsSettings } from './windows/settings/ObsSettings';
import ThemeAudit from './pages/ThemeAudit';
import SafeMode from './windows/SafeMode';

// list of React components to be used inside Vue components
export const components = {
  NameFolder,
  GoLiveWindow: createRoot(GoLiveWindow),
  EditStreamWindow: createRoot(EditStreamWindow),
  IconLibraryProperties,
  NewsBanner,
  PerformanceMetrics,
  PatchNotes,
  Display,
  TitleBar,
  Chat,
  Highlighter,
  Grow,
  Loader,
  NavTools,
  PlatformLogo,
  StreamScheduler: createRoot(StreamScheduler),
  AdvancedStatistics,
  SharedComponentsLibrary: createRoot(SharedComponentsLibrary),
  StartStreamingButton,
  TestWidgets,
  RenameSource,
  NotificationsArea,
  ObsSettings: createRoot(ObsSettings),
  ThemeAudit,
  AppsNav,
  StudioEditor,
  SafeMode,
};
