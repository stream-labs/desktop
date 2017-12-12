<template>
<modal-layout
    title="Troubleshooter"
    :showControls="false"
    :customControls="true"
>
  <div slot="controls">
    <button
        class="button button--action"
        @click="showSettings"
    >
      Open Settings
    </button>
  </div>

  <div slot="content">

    <div v-if="issue.code == 'FRAMES_DROPPED'">
      <h4>
        <span class="fa fa-warning"></span>
        {{ issue.message }}
      </h4>
      <p>
        Streamlabs-OBS detected skipped frames {{ moment(issue.date) }}.<br/>
      </p>
      <h4>What does it mean?</h4>
      <p>
        Some frames have not been sent to stream. Usually the problem is related to poor network bandwidth
      </p>
      <h4>
        What can I do?
      </h4>

      <ul>
        <li>Verify that your connection is good (try a speedtest, like fast.com) </li>
        <li>Ensure that nothing else is also uploading</li>
        <li>Change ingest server, sometimes there are issues</li>
        <li>If nothing of these worked, lower your bitrate</li>
      </ul>

    </div>


    <div v-if="issue.code == 'FRAMES_SKIPPED'">
      <h4>
        <span class="fa fa-warning"></span>
        {{ issue.message }}
      </h4>
      <p>
        Streamlabs-OBS detected skipped frames {{ moment(issue.date) }}.<br/>
      </p>
      <h4>What does it mean?</h4>
      <p>
        Some frames have not been encoded.
        Usually the problem is related to high CPU usage or to unsuitable encoder settings
      </p>
      <h4>
        What can I do?
      </h4>

      <ul>
        <li>Lower your encoder settings (preset)</li>
        <li>Ensure that you don't have any huge tasks that use your CPU resources</li>
      </ul>

    </div>


    <div v-if="issue.code == 'FRAMES_LAGGED'">
      <h4>
        <span class="fa fa-warning"></span>
        {{ issue.message }}
      </h4>
      <p>
        Streamlabs-OBS detected lagged frames {{ moment(issue.date) }}.<br/>
      </p>
      <h4>What does it mean?</h4>
      <p>
        Some frames took to much time to get rendered.
        Usually the problem is related to high GPU usage.
      </p>
      <h4>
        What can I do?
      </h4>

      <ul>
        <li>Reduce your base resolution</li>
        <li>Reduce your FPS </li>
        <li>Enable the capping ingame FPS if possible</li>
        <li>Reduce other video settings</li>
      </ul>

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

  p, ul {
    margin-bottom: 15px;
  }

</style>
