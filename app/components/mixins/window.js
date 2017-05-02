// The window mixin should only be used in components in
// app/windows, which are meant to be top level window components.

const { remote } = window.require('electron');

export default {

  mounted() {
    remote.getCurrentWindow().show();
  }

};
