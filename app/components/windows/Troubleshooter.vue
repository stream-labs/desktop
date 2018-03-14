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
        Streamlabs OBS has detected dropped frames {{ moment(issue.date) }}.<br/>
      </p>
      <h4>What does this mean?</h4>
      <p>
        Some frames have not been uploaded. This problem is usually related to a poor network connection.
      </p>
      <h4>
        What can I do?
      </h4>

      <ul>
        <li>Check the health of your Internet connection</li>
        <li>Change your ingest server</li>
        <li>If none of these worked, lower your bitrate</li>
      </ul>

    </div>


    <div v-if="issue.code == 'FRAMES_SKIPPED'">
      <h4>
        <span class="fa fa-warning"></span>
        {{ issue.message }}
      </h4>
      <p>
        Streamlabs OBS has detected skipped frames {{ moment(issue.date) }}.<br/>
      </p>
      <h4>What does this mean?</h4>
      <p>
        Some frames have not been encoded.
        This problem is usually due to high CPU usage or unsuitable encoder settings.
      </p>
      <h4>
        What can I do?
      </h4>

      <ul>
        <li>Lower your encoder settings (preset)</li>
        <li>Ensure that you don't have any other applications open that are heavy on your CPU</li>
        <li>Enable performance mode in the Editor context menu</li>
      </ul>

    </div>


    <div v-if="issue.code == 'FRAMES_LAGGED'">
      <h4>
        <span class="fa fa-warning"></span>
        {{ issue.message }}
      </h4>
      <p>
        Streamlabs OBS has detected lagged frames {{ moment(issue.date) }}.<br/>
      </p>
      <h4>What does this mean?</h4>
      <p>
        Some frames took too long to get rendered.
        Usually the problem is related to your game using up too many GPU resources.
        When this happens, Streamlabs OBS does not have any resources left over to render frames.
      </p>
      <h4>
        What can I do?
      </h4>

      <ul>
        <li>Cap your in-game framerate</li>
        <li>Enable VSync in your game</li>
        <li>Disable FreeSync or GSync in your Driver</li>
        <li>Lower graphics settings until you stop lagging frames</li>
        <li>Disable hardware decoding under any media sources(This will slightly increase cpu over gpu) </li>
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
