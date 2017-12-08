<template>
<modal-layout
    title="Troubleshooter"
    :showControls="false"
>
  <div slot="content">


    <div v-if="issue.code == 'FRAMES_SKIPPED'">
      <h4>
        <span class="fa fa-warning"></span>
        Skipped frames detected
      </h4>
      Streamlabs-OBS detected skipped frames {{ moment(issue.date) }}.<br/>
      <a href="#" @click="showSettings">
        Please check your settings
      </a><br/><br/>
    </div>


    <div v-if="issue.code == 'FRAMES_LAGGED'">
      <h4>
        <span class="fa fa-warning"></span>
        Lagged frames detected
      </h4>
      Streamlabs-OBS detected lagged frames {{ moment(issue.date) }}.<br/>
      <a href="#" @click="showSettings">
        Please check your settings
      </a><br/><br/>
    </div>


  </div>
</modal-layout>
</template>

<script lang="ts" src="./Troubleshooter.vue.ts"></script>

<style lang="less" scoped>
  @import "../../styles/index";

  .fa-warning {
    color: @red;
  }

</style>
