<template>
<modal-layout
  :show-controls="false"
  title="Add Source">
  <div slot="content"
    class="add-source">
    <!-- Standard sources -->
    <add-source-info
      v-if="inspectedSource === 'Image'"
      @clickAdd="selectSource('Image')"
      name="Image"
      description="Add images to your scene.">
      <img slot="media" src="../../../media/source-demos/source-image.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>png</li>
        <li>jpg</li>
        <li>jpeg</li>
        <li>gif</li>
        <li>tga</li>
        <li>bmp</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Image Slide Show'"
      @clickAdd="selectSource('Image Slide Show')"
      name="Image Slide Show"
      description="Add a slideshow of images to your scene.">
      <img slot="media" src="../../../media/source-demos/source-slide-show.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>png</li>
        <li>jpg</li>
        <li>jpeg</li>
        <li>gif</li>
        <li>tga</li>
        <li>bmp</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Media Source'"
      @clickAdd="selectSource('Media Source')"
      name="Media Source"
      description="Add videos to your scene.">
      <img slot="media" src="../../../media/source-demos/source-media.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>mp4</li>
        <li>ts</li>
        <li>mov</li>
        <li>flv</li>
        <li>mkv</li>
        <li>avi</li>
        <li>mp3</li>
        <li>ogg</li>
        <li>aac</li>
        <li>wav</li>
        <li>gif</li>
        <li>webm</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Text (FreeType 2)'"
      @clickAdd="selectSource('Text (FreeType 2)')"
      name="Text (FreeType 2)"
      description="Add text and choose from tons of fonts and colors.">
      <img slot="media" src="../../../media/source-demos/source-text.png"/>
      <ul slot="support-list" class="source-support__list">
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Window Capture'"
      @clickAdd="selectSource('Window Capture')"
      name="Window Capture"
      description="Capture a specific window you select.">
      <img slot="media" src="../../../media/source-demos/source-capture.png"/>
      <ul slot="support-list" class="source-support__list">
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Video Capture Device'"
      @clickAdd="selectSource('Video Capture Device')"
      name="Video Capture Device"
      description="Select from your build in USB webcam or an external.">
      <img slot="media" src="../../../media/source-demos/source-video.png"/>
      <ul slot="support-list" class="source-support__list">
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Audio Output Capture'"
      @clickAdd="selectSource('Audio Output Capture')"
      name="Audio Output Capture"
      description="Add images to your scene.">
      <img slot="media" src="../../../media/source-demos/source-output.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>png</li>
        <li>jpg</li>
        <li>jpeg</li>
        <li>gif</li>
        <li>tga</li>
        <li>bmp</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Color Source'"
      @clickAdd="selectSource('Color Source')"
      name="Color Source"
      description="Add a color to the background of your whole scene or just a part.">
      <img slot="media" src="../../../media/source-demos/source-color.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Hex</li>
        <li>RGBA</li>
        <li>HSV</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'BrowserSource'"
      @clickAdd="selectSource('BrowserSource')"
      name="BrowserSource"
      description="Allows you to add web-based content as a source, such as web pages and Flash SWFs.">
      <img slot="media" src="../../../media/source-demos/source-browser.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Hex</li>
        <li>RGBA</li>
        <li>HSV</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Text (GDI+)'"
      @clickAdd="selectSource('Text (GDI+)')"
      name="Text (GDI+)"
      description="Allows you to add web-based content as a source, such as web pages and Flash SWFs.">
      <img slot="media" src="../../../media/source-demos/source-text.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Hex</li>
        <li>RGBA</li>
        <li>HSV</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Display Capture'"
      @clickAdd="selectSource('Display Capture')"
      name="Display Capture"
      description="Capture your entire computer monitor.">
      <img slot="media" src="../../../media/source-demos/source-capture-full.png"/>
      <ul slot="support-list" class="source-support__list">
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Game Capture'"
      @clickAdd="selectSource('Game Capture')"
      name="Game Capture"
      description="Capture your entire computer monitor.">
      <img slot="media" src="../../../media/source-demos/source-game-capture.png"/>
      <ul slot="support-list" class="source-support__list">
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === 'Audio Input Capture'"
      @clickAdd="selectSource('Audio Input Capture')"
      name="Audio Input Capture"
      description="Add images to your scene.">
      <img slot="media" src="../../../media/source-demos/source-input.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>png</li>
        <li>jpg</li>
        <li>jpeg</li>
        <li>gif</li>
        <li>tga</li>
        <li>bmp</li>
      </ul>
    </add-source-info>
    <!-- Widget Sources -->
    <add-source-info
      v-if="inspectedSource === widgetTypes.AlertBox"
      @clickAdd="selectWidget(widgetTypes.AlertBox)"
      name="Alertbox"
      description="Thanks viewers with notification popups.">
      <video slot="media" autoplay loop muted src="../../../media/source-demos/source-alertbox.mp4"></video>
      <ul slot="support-list" class="source-support__list">
        <li>Donations</li>
        <li>Subscriptions</li>
        <li>Follows</li>
        <li>Bits</li>
        <li>Hosts</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === widgetTypes.DonationTicker"
      @clickAdd="selectWidget(widgetTypes.DonationTicker)"
      name="Donation Ticker"
      description="Show off your most recent donations to your viewers.">
      <video slot="media" autoplay loop muted src="../../../media/source-demos/source-donation-ticker.mp4"></video>
      <ul slot="support-list" class="source-support__list">
        <li>Donations</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === widgetTypes.EventList"
      @clickAdd="selectWidget(widgetTypes.EventList)"
      name="Event List"
      description="Include your channel's most recent events into your stream.">
      <video slot="media" autoplay loop muted src="../../../media/source-demos/source-eventlist.mp4"></video>
      <ul slot="support-list" class="source-support__list">
        <li>Donations</li>
        <li>Subscriptions</li>
        <li>Follows</li>
        <li>Bits</li>
        <li>Hosts</li>
        <li>Redemptions</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === widgetTypes.DonationGoal"
      @clickAdd="selectWidget(widgetTypes.DonationGoal)"
      name="Donation Goal"
      description="Set a goal for your viewers to help you reach below.">
      <img slot="media" src="../../../media/source-demos/source-donation-goal.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Donations</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === widgetTypes.ChatBox"
      @clickAdd="selectWidget(widgetTypes.ChatBox)"
      name="Chatbox"
      description="Include your channel's chat into your stream.">
      <video slot="media" autoplay loop muted src="../../../media/source-demos/source-chatbox.mp4"></video>
      <ul slot="support-list" class="source-support__list">
        <li>Twitch chat</li>
        <li>Youtube chat</li>
      </ul>
    </add-source-info>
    <add-source-info
      v-if="inspectedSource === widgetTypes.TheJar"
      @clickAdd="selectWidget(widgetTypes.TheJar)"
      name="The Jar"
      description="The jar that catches bits, tips, and more.">
      <video slot="media" autoplay loop muted src="../../../media/source-demos/source-jar.mp4"></video>
      <ul slot="support-list" class="source-support__list">
        <li>Donations</li>
        <li>Subscriptions</li>
        <li>Follows</li>
        <li>Bits</li>
        <li>Hosts</li>
      </ul>
    </add-source-info>
    <div
      class="source-info"
      v-if="inspectedSource === null">
      <h3>Welcome to sources!</h3>
      <ol>
        <li>Browse through our Standard and Widget sources</li>
        <li>Click a source to get more details about it</li>
        <li>Click 'Add Source' when you're ready to add it to your scene</li>
      </ol>
    </div>

    <div class="sources">
      <div class="source-group">
        <h4>Standard</h4>
        <ul class="source-list">
          <li
            v-for="source in availableSources"
            class="source source--standard"
            @click="inspectSource(source)">
            {{ source }}
          </li>
        </ul>
      </div>
      <div class="source-group" v-if="loggedIn">
        <h4>Widgets</h4>
        <div class="source-list--widgets">
          <div
            class="source source--widget"
            @click="inspectSource(widgetTypes.AlertBox)">
            <div class="source__icon">
              <img src="../../../media/images/icons/alertbox-no-bg.png">
            </div>
            <div>Alertbox</div>
          </div>
          <div
            class="source source--widget"
            @click="inspectSource(widgetTypes.DonationGoal)">
            <div class="source__icon">
              <img src="../../../media/images/icons/donation-goal-no-bg.png">
            </div>
            <div>Donation Goal</div>
          </div>
          <div
            class="source source--widget"
            @click="inspectSource(widgetTypes.DonationTicker)">
            <div class="source__icon">
              <img src="../../../media/images/icons/donation-ticker-no-bg.png">
            </div>
            <div>Donation Ticker</div>
          </div>
          <div
            class="source source--widget"
            @click="inspectSource(widgetTypes.ChatBox)">
            <div class="source__icon">
              <img src="../../../media/images/icons/chatbox-no-bg.png">
            </div>
            <div>Chatbox</div>
          </div>
          <div
            class="source source--widget"
            @click="inspectSource(widgetTypes.EventList)">
            <div class="source__icon">
              <img src="../../../media/images/icons/event-list-no-bg.png">
            </div>
            <div>Event List</div>
          </div>
          <div
            class="source source--widget"
            @click="inspectSource(widgetTypes.TheJar)">
            <div class="source__icon">
              <img src="../../../media/images/icons/the-jar-no-bg.png">
            </div>
            <div>The Jar</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { Inject } from '../../services/service';
import ModalLayout from '../ModalLayout.vue';
import { WindowService } from '../../services/window';
import windowMixin from '../mixins/window';
import AddSourceInfo from './AddSourceInfo.vue';
import { SourcesService, TSourceType } from '../../services/sources';
import { UserService } from '../../services/user';
import { WidgetsService, WidgetType } from '../../services/widgets';

type TInspectableSource = TSourceType | WidgetType;

@Component({
  components: {
    ModalLayout,
    AddSourceInfo
  },
  mixins: [windowMixin],
})
export default class AddSource extends Vue {

  @Inject()
  sourcesService: SourcesService;

  @Inject()
  userService: UserService;

  @Inject()
  widgetsService:WidgetsService;

  widgetTypes = WidgetType;

  availableSources = this.sourcesService.getAvailableSourcesTypes();
  windowService: WindowService = WindowService.instance;

  selectSource(sourceName: TSourceType) {
    this.windowService.showNameSource(sourceName);
  }

  selectWidget(type: WidgetType) {
    this.windowService.showNameWidget(type);
  }

  inspectedSource: TInspectableSource = null;

  inspectSource(inspectedSource: TInspectableSource) {
    this.inspectedSource = inspectedSource;
  }

  get loggedIn() {
    return this.userService.isLoggedIn();
  }

}
</script>

<style lang="less">
@import "../../styles/index";
.source-info {
  padding: 20px;
  border-bottom: 1px solid @day-border;
  display: flex;
  flex-direction: column;
  background: @day-secondary;
  flex: 0 0 220px;
  height: 220px;
  .button {
    position: absolute;
    right: 20px;
    top: 20px;
  }
}
.night-theme {
  .source-info {
    border-color: @night-border;
    background-color: @night-primary;
  }
}
</style>
<style lang="less" scoped>
@import "../../styles/index";
h4 {
  color: @grey;
}
.add-source {
  color: @navy;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
}
.sources {
  padding: 20px;
  display: flex;
  flex: 1 0 auto;
  .source-group {
    &:last-child {
      padding: 20px 0 20px 20px;
      border-right: none;
    }
  }
}
.source-group {
  border-right: 1px solid @day-border;
  margin: -20px 0px -20px 0px;
  padding: 20px 20px 20px 0;
  flex: 0 0 50%;
}
.source-list {
  list-style-type: none;
  margin: 0;
}
.source-list--widgets {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}
.source {
  color: @navy;
  cursor: pointer;
  .transition;
  &:hover {
    color: @navy-secondary;
    .semibold;
  }
}
.source--standard {
  display: inline-block;
  width: 49%;
  padding-right: 1%;
  margin-bottom: 4px;
}
.source--widget {
  border: 1px solid @day-border;
  display: flex;
  align-items: center;
  padding: 10px;
  width: 49%;
  margin-bottom: 10px;
  .radius;
  .transition;
  &:hover {
    background: @day-secondary;
  }
  &:nth-child(5), &:nth-child(6) {
    margin-bottom: 0;
  }
}
.source__icon {
  margin-right: 10px;
  width: 30px;
}

.night-theme {
  .add-source {
    color: @grey;
  }
  .source {
    color: @grey;
    &:hover {
      color: @white;
    }
  }
  .source--widget {
    border-color: @night-border;
    &:hover {
      background: @night-hover;
      border-color: @night-hover;
    }
  }
  .source-group {
    border-color: @night-border;
  }
}
</style>
