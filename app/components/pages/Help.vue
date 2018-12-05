<template>
  <div class="help-page-wrapper">
    <div class="help-page">
      <div class="callout callout--discord">
        <span>Join 200K+ others on the <a @click="openDiscord">Streamlabs OBS Discord</a> for free 24h support.</span>
        <button class="button button--discord" @click="openDiscord">Join Discord <i class="icon-discord"></i></button>
      </div>
      <div class="help-page__section">
        <div class="help-page__header">
          <h1>Getting Started</h1>
          <div>Everything you need to get started with Streamlabs.</div>
        </div>

        <div v-for="(video, idx) in videos" :key="idx" v-if="idx < 3">
          <div class="help-item">
            <div class="help-item__info">
              <div>
                <h2>{{ video.name }}</h2>
                <div>{{ video.description }}</div>
              </div>
              <a @click="showMoreInfo(idx)">Read More</a>
            </div>
            <div class="help-item__thumbnail" @click="openVideo(video.link)">
              <img :src="require(`../../../media/images/yt-thumbnails/${video.image}`)">
            </div>
          </div>
          <div v-show="video.readMore" class="help-item__more-info">
            <div class="help-item__more-info-content">
              <h2>{{ video.name }}</h2>
              <i class="icon-close" @click="hideMoreInfo(idx)"></i>
              <div class="help-item__more-info-body">
                <p>{{ video.infoOverview }}</p>
                <div>{{ video.infoDirections }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="help-view-more" @click="openYoutube">View More</div>
      </div>

      <div class="help-page__section">
        <div class="help-page__header">
          <h1>Troubleshooting</h1>
          <div>Having issues with Streamlabs? Here are some potential fixes.</div>
        </div>
        <div v-for="(video, idx) in videos" :key="idx" v-if="idx >= 3">
          <div class="help-item">
            <div class="help-item__info">
              <div>
                <h2>{{ video.name }}</h2>
                <div>{{ video.description }}</div>
              </div>
              <a @click="showMoreInfo(idx)">Read More</a>
            </div>
            <div class="help-item__thumbnail" @click="openVideo(video.link)">
              <img :src="require(`../../../media/images/yt-thumbnails/${video.image}`)">
            </div>
          </div>
          <div v-show="video.readMore" class="help-item__more-info">
            <div class="help-item__more-info-content">
              <h2>{{ video.name }}</h2>
              <i class="icon-close" @click="hideMoreInfo(idx)"></i>
              <div class="help-item__more-info-body">
                <p>{{ video.infoOverview }}</p>
                <div>{{ video.infoDirections }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="help-view-more" @click="openYoutube">View More</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./Help.vue.ts"></script>

<style lang="less" scoped>
@import '../../styles/index';

.help-page-wrapper {
  overflow-y: auto;
  max-height: 100vh;
}

.help-page {
  .padding(3);
  display: grid;
  grid-column-gap: 24px;
  grid-template-columns: 1fr 1fr;
  align-items: flex-start;
  align-content: flex-start;
  max-width: 1920px;
  width: 100%;
  height: 100%;
  margin: 0 auto;
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
  grid-template-columns: 1fr 242px;
  grid-column-gap: 24px;
  .margin-bottom(2);

  h2 {
    .margin-bottom(2);
  }
}

.help-item__thumbnail {
  .radius(2);
  overflow: hidden;
  position: relative;
  height: 136px;

  &:before {
    font-family: 'Font Awesome 5 Free';
    font-weight: 900;
    content: '\f04b';
    color: @white;
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.16);
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

.help-item__more-info {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.help-item__more-info-content {
  width: 60%;
  height: auto;
  max-height: 400px;
  .radius();
  background-color: @day-section;
  .padding(3);
  position: relative;
  z-index: 10;
  .day-shadow();

  .icon-close {
    .absolute(16px, 16px, auto, auto);
  }
}

.help-item__more-info-body {
  overflow-y: auto;
  overflow-x: hidden;
  max-height: 306px;
}

.night-theme {
  .help-item,
  .help-view-more,
  .help-item__more-info-content {
    background-color: @night-section-alt;
  }

  .help-item__more-info-content {
    .night-shadow();
  }
}
</style>
