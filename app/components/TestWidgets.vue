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
        <a class="slide-open__close"
          @click="slideOpen = !slideOpen">
          <i class="fa fa-times" aria-hidden="true"></i>
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

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { WidgetsService } from '../services/widgets';
import { Inject } from '../services/service';

@Component({})
export default class TestWidgets extends Vue {

  @Inject()
  widgetsService:WidgetsService;

  slideOpen = false;

  get widgetTesters() {
    return this.widgetsService.getTesters();
  }

}
</script>

