/// <reference path="./index.d.ts" />
import NameFolder from './windows/NameFolder';
import NewsBanner from './root/NewsBanner';
import PatchNotes from './pages/PatchNotes';
import Display from './shared/Display';
import TitleBar from './shared/TitleBar';
import Chat from './root/Chat';
import NavTools from './sidebar/NavTools';

// list of React components for usage inside Vue components
export const components = {
  NameFolder,
  NewsBanner,
  PatchNotes,
  Display,
  TitleBar,
  Chat,
  NavTools,
};
