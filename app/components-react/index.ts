/// <reference path="./index.d.ts" />
import NameFolder from './windows/NameFolder';
import IconLibraryProperties from './windows/IconLibraryProperties';
import NewsBanner from './root/NewsBanner';
import PatchNotes from './pages/PatchNotes';
import Display from './shared/Display';
import TitleBar from './shared/TitleBar';
import Chat from './root/Chat';

// list of React components for usage inside Vue components
export const components = {
  NameFolder,
  IconLibraryProperties,
  NewsBanner,
  PatchNotes,
  Display,
  TitleBar,
  Chat,
};
