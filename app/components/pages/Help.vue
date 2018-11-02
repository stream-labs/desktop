<template>
  <div class="help-page">
    <div class="callout callout--discord">
      <span>Join 200K+ others on the <a @click="openDiscord">Streamlabs OBS Discord</a> for free 24h support.</span>
      <button class="button button--discord" @click="openDiscord">Join Discord <i class="icon-discord"></i></button>
    </div>
    <div class="help-page__section">
      <div class="help-page__header">
        <h1>Get Started</h1>
        <div>Everything you need to get started with Streamlabs.</div>
      </div>

      <div class="help-item">
        <div class="help-item__info">
          <div>
            <h2>Streamlabs OBS Quickstart</h2>
            <div>How to download, install, and Go Live with Streamlabs OBS.</div>
          </div>
          <a @click="openYoutubeQuickstart">View on Youtube</a>
        </div>
        <div class="help-item__video">
          <webview src="https://www.youtube.com/embed/d--1z_W9IVw?controls=0"></webview>
          </div>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <div>
            <h2>Merch Store Setup</h2>
            <div>Build a Streamlabs automated Merch Store in under 60 seconds.</div>
          </div>
          <a @click="openYoutubeMerch">View on Youtube</a>
        </div>
        <div class="help-item__video">
          <webview src="https://www.youtube.com/embed/epd8cYG2ArI?controls=0"></webview>
          </div>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <div>
            <h2>Affiliates Guide</h2>
            <div>Earn revenue and raise money for charity by sharing Streamlabs OBS with your friends.</div>
          </div>
          <a @click="openYoutubeAffiliates">View on Youtube</a>
        </div>
        <div class="help-item__video">
          <webview src="https://www.youtube.com/embed/cHMyxE5NsFQ?controls=0"></webview>
          </div>
      </div>
      <div class="help-view-more" @click="openYoutube">View More</div>
    </div>

    <div class="help-page__section">
      <div class="help-page__header">
        <h1>Troubleshooting</h1>
        <div>Having issues with Streamlabs? Here are some potential fixes.</div>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <div>
            <h2>Frame Management Help</h2>
            <div>Spot issues with CPU and GPU usage while streaming.</div>
          </div>
          <a @click="openYoutubeFrames">View on Youtube</a>
        </div>
        <div class="help-item__video">
          <webview src="https://www.youtube.com/embed/WnRhaZaQ2ns?controls=0"></webview>
          </div>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <div>
            <h2>Troubleshooting Alerts</h2>
            <div>Identify and correct issues with your alerts.</div>
          </div>
          <a @click="openYoutubeTroubleshoot">View on Youtube</a>
        </div>
        <div class="help-item__video">
          <webview src="https://www.youtube.com/embed/GfVQ9KhBlDU?controls=0"></webview>
          </div>
      </div>
      <div class="help-item">
        <div class="help-item__info">
          <div>
            <h2>How To Stream On Twitch</h2>
            <div>Make sure your account is linked, check your donation settings and import a free overlay.</div>
          </div>
          <a @click="openYoutubeTwitch">View on Youtube</a>
        </div>
        <div class="help-item__video">
          <webview src="https://www.youtube.com/embed/aplbiAgZjtY?controls=0"></webview>
        </div>
      </div>

      <div class="help-view-more" @click="openYoutube">View More</div>
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

  a {
    display: inline-block;
    color: @white;
    .weight(@medium);
  }
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
  grid-template-columns: 5fr 2fr;
  grid-column-gap: 24px;
  .margin-bottom(2);

  h2 {
    .margin-bottom(2);
  }

  webview {
    .radius(2);
    width: 100%;
    height: 140px;
    overflow: hidden;
  }
}

.help-item__info {
  display: flex;
  justify-content: space-between;
  flex-direction: column;

  a {
    text-decoration: underline;
  }
}

.help-item__video {
  text-align: right;
}

.help-view-more {
  background-color: @day-section;
  .radius();
  .padding(2);
  text-align: center;
  .weight(@medium);
  cursor: pointer;
  .margin-top(3);
}

.night-theme {
  .help-item,
  .help-view-more {
    background-color: @night-section-alt;
  }
}
</style>
