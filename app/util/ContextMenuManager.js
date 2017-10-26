// This singleton class provides access to the
// context menu for this particular window.  This
// menu is a replacement for the native context menu.

import Vue from 'vue';
import ContextMenu from '../components/ContextMenu.vue';

class ContextMenuManager {

  init() {
    this.menu = new ContextMenu({
      el: '#contextmenu'
    });
  }

  positionMenu(x, y) {
    this.menu.pos = { x, y };
  }

  showMenu(layout, options) {
    this.menu.items = layout;

    if (options.position) {
      this.positionMenu(
        options.position.x,
        options.position.y
      );
    } else {
      this.positionMenu(
        options.mouseEvent.pageX,
        options.mouseEvent.pageY
      );
    }

    this.menu.show();
  }

}

export default new ContextMenuManager();
