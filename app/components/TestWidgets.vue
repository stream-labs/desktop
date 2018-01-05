<template>
  <div>
    <a
      class="slide-open__open link"
      @click="slideOpen = !slideOpen">
      <i class="fa fa-arrow-left" aria-hidden="true"></i> Test Widgets
    </a>
    <transition name="slide-fade">
      <div
        v-if="slideOpen"
        class="slide-open__menu">
        <a class="slide-open__close link"
          @click="slideOpen = !slideOpen">
          <i class="fa fa-arrow-right" aria-hidden="true"></i> Hide Test Widgets
        </a>
        <div class="button-container">
          <button
            class="button button--trans"
            v-for="tester in widgetTesters"
            :key="tester.name"
            @click="tester.test()">
            {{ tester.name }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" src="./TestWidgets.vue.ts"></script>
