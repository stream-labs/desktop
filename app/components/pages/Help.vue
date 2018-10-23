<template>
  <div class="help-page">
    <div class="callout callout--discord">
      <span>Join 200K+ others on the Streamlabs OBS Discord for free 24h support.</span>
      <button class="button button--discord" @click="openDiscord">Join Discord <i class="icon-discord"></i></button>
    </div>
    <div class="help-page__section">
      <div class="help-page__header">
        <h1>Get Started</h1>
        <div>Everything you need to get started with Streamlabs.</div>
      </div>

      <div class="help-item">
        <div class="help-item__info">
          <h2>Streamlabs OBS Quickstart</h2>
          <div>How to download, install, and Go Live with Streamlabs OBS.</div>
        </div>
        <div class="help-item__video">
          <iframe
            width="'100%'"
            height="'auto'"
            src="https://www.youtube.com/embed/d--1z_W9IVw"
            frameborder="0" allow="autoplay; encrypted-media"
            allowfullscreen></iframe>
        </div>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <h2>Merch Store Setup</h2>
          <div>Build a Streamlabs automated Merch Store in under 60 seconds.</div>
        </div>
        <iframe
          width="'100%'"
          height="'auto'"
          src="https://www.youtube.com/watch?v=epd8cYG2ArI"
          frameborder="0" allow="autoplay; encrypted-media"
          allowfullscreen></iframe>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <h2>Affiliates Guide</h2>
          <div>Earn revenue and raise money for charity by sharing Streamlabs OBS with your friends.</div>
        </div>
        <div class="help-item__video">
          <iframe
            width="'100%'"
            height="'auto'"
            src="https://www.youtube.com/watch?v=cHMyxE5NsFQ"
            frameborder="0" allow="autoplay; encrypted-media"
            allowfullscreen></iframe>
        </div>
      </div>
    </div>
    <div class="help-page__section">
      <div class="help-page__header">
        <h1>Troubleshooting</h1>
        <div>Having issues with Streamlabs? Here are some potential fixes.</div>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <h2>Frame Management Help</h2>
          <div>Spot issues with CPU and GPU usage while streaming.</div>
        </div>
        <iframe
          width="'100%'"
          height="'auto'"
          src="https://www.youtube.com/watch?v=WnRhaZaQ2ns"
          frameborder="0" allow="autoplay; encrypted-media"
          allowfullscreen></iframe>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <h2>Troubleshooting Alerts</h2>
          <div>Identify and correct issues with your alerts.</div>
        </div>
        <iframe
          width="'100%'"
          height="'auto'"
          src="https://www.youtube.com/watch?v=GfVQ9KhBlDU"
          frameborder="0" allow="autoplay; encrypted-media"
          allowfullscreen></iframe>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <h2>How To Stream On Twitch</h2>
          <div>Make sure your account is linked, check your donation settings and import a free overlay.</div>
          <iframe
            width="'100%'"
            height="'auto'"
            src="https://youtu.be/aplbiAgZjtY"
            frameborder="0" allow="autoplay; encrypted-media"
            allowfullscreen></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./Help.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/index";

.help-page {
  .padding(3);
  display: grid;
  grid-column-gap: 24px;
  grid-template-columns: 1fr 1fr;
  overflow-y: auto;
}

.callout {
  .radius();
  border: 0;
  .margin-bottom(3);
  grid-column-start: 1;
  grid-column-end: 3;
}

.callout--discord {
  background-color: @discord;
  .padding(2);
  color: @white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.button--discord {
  background-color: @white;
  color: @discord;

  .icon-discord {
    .margin-right(@0);
    .margin-left(2);
  }
}

.help-page__header {
  .margin-bottom(3);

  h1 {
    .margin-bottom(2);
  }
}

.help-item {
  background-color: @day-section;
  .radius(2);
  .padding(2);
  display: grid;
  grid-template-columns: 3fr 2fr;
  .margin-bottom(2);

  h2 {
    .margin-bottom(2);
  }

  iframe {
    .radius(2);
  }
}

.night-theme {
  .help-item {
    background-color: @night-section-alt;
  }
}
</style>
