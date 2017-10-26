<template>
<div>
  <div
    ref="menu"
    :style="menuStyle"
    class="ContextMenu-menu">
    <ul class="ContextMenu-list">
      <li
        @click="itemClicked(item)"
        :class="classesForItem(item)"
        v-for="item in items">
        {{ item.label }}
      </li>
    </ul>
  </div>
  <div
    v-if="visible"
    class="ContextMenu-overlay"
    @click="dismiss"/>
</div>
</template>

<script>
import Vue from 'vue';

// This is a top level component, so we extend Vue
export default Vue.extend({

  data() {
    return {
      visible: false,
      items: [],
      pos: {
        x: 100,
        y: 100
      }
    };
  },

  methods: {
    show() {
      this.visible = true;
    },

    dismiss() {
      this.visible = false;
    },

    // Makes sure the menu is within the visible bounds
    // of the window.
    adjustPosition() {
      let menuWidth = this.$refs.menu.offsetWidth + 5;
      let menuHeight = this.$refs.menu.offsetHeight + 5;

      if ((window.innerWidth - this.pos.x) < menuWidth) {
        this.pos.x = window.innerWidth - menuWidth;
      }

      if ((window.innerHeight - this.pos.y) < menuHeight) {
        this.pos.y = window.innerHeight - menuHeight;
      }
    },

    classesForItem(item) {
      return {
        'ContextMenu-listItem': item.type !== 'separator',
        'ContextMenu-listItemSeparator': item.type === 'separator'
      };
    },

    itemClicked(item) {
      if (item.type === 'action') {
        this.dismiss();
        item.handler();
      }
    }
  },

  watch: {
    pos() {
      this.adjustPosition();
    }
  },

  computed: {
    menuStyle() {
      // Instead of hiding the menu, we just keep it rendered off
      // screen.  This is a little hackish, but it allows us to
      // determine the size of the window and dynamically position
      // it before we show it to the user, since it is always in
      // the DOM at its correct size.
      let x = -10000;

      if (this.visible) {
        x = this.pos.x;
      }

      return {
        top: this.pos.y + 'px',
        left: x + 'px'
      };
    }
  }

});
</script>

<style lang="less" scoped>
.ContextMenu-overlay {
  position: fixed;
  top: 0;
  width: 100%;
  height: 100%;
}

.ContextMenu-menu {
  position: absolute;
  z-index: 1000;

  min-width: 200px;

  background-color: white;
  border: 1px solid #eee;
  border-radius: 2px;

  box-shadow: 0 10px 24px 0 rgba(43,56,63,0.35);
}

.ContextMenu-list {
  list-style-type: none;
  margin: 0;
}

.ContextMenu-listItem {
  padding: 12px 20px;
  cursor: default;

  &:hover {
    background-color: #eee;
  }
}

.ContextMenu-listItemSeparator {
  border-bottom: 1px solid #eee;
}
</style>
