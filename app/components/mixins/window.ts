// The window mixin should only be used in components in
// app/windows, which are meant to be top level window components.

import electron from 'electron';
const { remote } = electron;

export default {

  mounted() {
    remote.getCurrentWindow().show();
  }

};
