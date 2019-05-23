<template>
<div class="patch-notes-page">
  <div
    v-if="notes.showChest"
    class="patch-notes-container patch-notes-container--closed"
    :class="{ 'patch-notes-container--closing': patchNotesClosing }">
    <div class="patch-notes-content">
      <div class="patch-notes-header">
        <video
          src="../../../media/chest.webm"
          ref="patchNotesVideo"
          class="patch-notes-chest">
        </video>
        <video
          src="../../../media/chest-deco.webm"
          class="patch-notes-chest-deco"
          autoplay
          loop>
        </video>
      </div>

      <button
        @click="show"
        class="patch-notes-button button button--action">
        Open Update {{ notes.version }}
      </button>
    </div>
  </div>

  <div
    class="patch-notes-container"
    :class="{
      'patch-notes-container--opened': notes.showChest,
      'patch-notes-container--opening': patchNotesOpening
    }">
    <div class="patch-notes-content">
      <div class="patch-notes-header">
        <div class="patch-notes-title">
          {{ notes.title }}
        </div>
        <div class="patch-notes-version">
          {{ notes.version }}
        </div>
      </div>
      <ul class="patch-notes-list">
        <li
          class="patch-notes-item"
          v-for="item in notes.notes"
          :key="item">
          {{ item }}
        </li>
      </ul>
      <button
        @click="done"
        class="patch-notes-button button button--action">
        Done
      </button>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./PatchNotes.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.patch-notes-chest,
.patch-notes-chest-deco {
  width: 100%;
}

.patch-notes-chest-deco {
  position: absolute;
}

.patch-notes-chest {
  animation: floatingChest ease-in-out 1.5s infinite alternate;
}

.patch-notes-container--opened {
  opacity: 0;
  display: none;

  &.patch-notes-container--opening {
    display: flex;
    animation: fadeIn 1s ease-in-out 1.5s 1 forwards;
  }
}

.patch-notes-container--closed {
  z-index: 10;
  display: flex;

  &.patch-notes-container--closing {
    overflow: visible;
    animation: fadeOut 1s ease-in .75s forwards;

    .patch-notes-chest {
      animation: expandChest .5s ease-in .25s 1 forwards;
    }

    .patch-notes-button {
      animation: hideButton .25s ease-in 1 forwards;
    }
  }

  .patch-notes-header {
    align-items: center;
    position: relative;
  }

  .patch-notes-content {
    height: 280px;
  }

  .patch-notes-button {
    position: absolute;
    bottom: 0;
  }
}

@keyframes floatingChest {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0);
  }
}

@keyframes hideButton {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    display: none;
  }
}

@keyframes expandChest {
  0% {
    transform: scale(1)
  }

  100% {
    transform: scale(1.2);
  }
}

@keyframes fadeOut {
  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    display: none;
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

.patch-notes-page {
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.patch-notes-container {
  width: 400px;
  overflow: auto;
  position: absolute;
}

.patch-notes-content {
  position: relative;
}

.patch-notes-header {
  display: flex;
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0.5px;
}

.patch-notes-title {
  flex-grow: 1;
  color: var(--title);
}

.patch-notes-version {
  color: var(--icon);
}

.patch-notes-list {
  margin-top: 20px;
  margin-bottom: 30px;
}

.patch-notes-button {
  width: 100%;
}
</style>
