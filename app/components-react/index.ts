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
import NavTools from './sidebar/NavTools';
import PlatformLogo from './shared/PlatformLogo';
import { createRoot } from './root/ReactRoot';

// list of React components for usage inside Vue components
export const components = {
  NameFolder,
  GoLiveWindow: createRoot(GoLiveWindow),
  EditStreamWindow,
  IconLibraryProperties,
  NewsBanner,
  PerformanceMetrics,
  PatchNotes,
  Display,
  TitleBar,
  Chat,
  NavTools,
  PlatformLogo,
};
