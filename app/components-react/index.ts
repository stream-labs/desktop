/// <reference path="./index.d.ts" />
import NameFolder from './windows/NameFolder';
import GoLiveWindow from './windows/go-live/GoLiveWindow';
import EditStreamWindow from './windows/go-live/EditStreamWindow';
import Playground from './windows/Playground';
import IconLibraryProperties from './windows/IconLibraryProperties';
import NewsBanner from './root/NewsBanner';
import PatchNotes from './pages/PatchNotes';
import Display from './shared/Display';
import TitleBar from './shared/TitleBar';
import Chat from './root/Chat';

// list of React components for usage inside Vue components
export const components = {
  NameFolder,
  GoLiveWindow,
  EditStreamWindow,
  Playground,
  IconLibraryProperties,
  NewsBanner,
  PatchNotes,
  Display,
  TitleBar,
  Chat,
};
