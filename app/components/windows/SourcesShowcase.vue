<template>
<modal-layout
  :show-controls="false"
  :content-styles="{ padding: 0 }"
  title="Add Source">

  <div slot="content"
    class="add-source">
    <!-- Standard sources -->
    <add-source-info
      v-if="inspectedSource === 'image_source'"
      @clickAdd="selectSource('image_source')"
      name="Image"
      description="Add images to your scene."
      key="1">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/image.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/image.png"/>
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
      v-if="inspectedSource === 'slideshow'"
      @clickAdd="selectSource('slideshow')"
      name="Image Slide Show"
      description="Add a slideshow of images to your scene."
      key="2">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/image-slide-show.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/image-slide-show.png"/>
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
      v-if="inspectedSource === 'ffmpeg_source'"
      @clickAdd="selectSource('ffmpeg_source')"
      name="Media Source"
      description="Add videos or sound clips to your scene."
      key="3">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/media.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/media.png"/>
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
      v-if="inspectedSource === 'window_capture'"
      @clickAdd="selectSource('window_capture')"
      name="Window Capture"
      description="Capture a specific window that's open on your computer."
      key="4">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/window-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/window-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Compatible with most modern browsers and programs</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'dshow_input'"
      @clickAdd="selectSource('dshow_input')"
      name="Video Capture Device"
      description="Select from your build in USB webcam or an external."
      key="5">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/video-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/video-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Built in webcam</li>
        <li>Logitech webcam</li>
        <li>Capture cards (Elgato, Avermedia, BlackMagic)</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'wasapi_output_capture'"
      @clickAdd="selectSource('wasapi_output_capture')"
      name="Audio Output Capture"
      description="Captures your desktop audio for the purpose of playing sound, such as music or speech."
      key="6">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/audio-output.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/audio-output.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Desktop audio</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'color_source'"
      @clickAdd="selectSource('color_source')"
      name="Color Source"
      description="Add a color to the background of your whole scene or just a part."
      key="7">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/color-source.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/color-source.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Hex</li>
        <li>RGBA</li>
        <li>HSV</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'browser_source'"
      @clickAdd="selectSource('browser_source')"
      name="BrowserSource"
      description="Allows you to add web-based content as a source, such as web pages and Flash SWFs."
      key="8">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/browser-source.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/browser-source.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Websites</li>
        <li>Third party widgets</li>
        <li>HTML</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'text_gdiplus'"
      @clickAdd="selectSource('text_gdiplus')"
      name="Text (GDI+)"
      description="Add text to your scene and adjust its style."
      key="9">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/text.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/text.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Hex</li>
        <li>RGBA</li>
        <li>HSV</li>
        <li>System Fonts</li>
        <li>System Sizes</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'monitor_capture'"
      @clickAdd="selectSource('monitor_capture')"
      name="Display Capture"
      description="Capture your entire computer monitor."
      key="10">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/display-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/display-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Primary monitor</li>
        <li>Secondary monitor</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'game_capture'"
      @clickAdd="selectSource('game_capture')"
      name="Game Capture"
      description="Capture a game you're playing on your computer."
      key="11">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/game-capture.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/game-capture.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Built in works with most modern computer games</li>
      </ul>
    </add-source-info>

    <add-source-info
      class='ndi-source'
      v-if="inspectedSource === 'ndi_source'"
      @clickAdd="selectSource('ndi_source')"
      showSupport="false"
      name="NDI source"
      description="Allow you to capture NDI output streams.">
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'wasapi_input_capture'"
      @clickAdd="selectSource('wasapi_input_capture')"
      name="Audio Input Capture"
      description="Any device that attaches to a computer for the purpose of capturing sound, such as music or speech."
      key="12">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/audio-input.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/audio-input.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Built in microphones</li>
        <li>USB microphones</li>
        <li>Other USB devices</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'decklink-input'"
      @clickAdd="selectSource('decklink-input')"
      name="Blackmagic Device"
      description="Capture the feed your decklink device is capturing."
      key="13">
      <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/sources.png"/>
      <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/sources.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Works with most of the recent Blackmagic cards.</li>
      </ul>
    </add-source-info>

    <!-- Widget Sources -->
    <add-source-info
      v-if="inspectedSource === widgetTypes.AlertBox"
      @clickAdd="selectWidget(widgetTypes.AlertBox)"
      name="Alertbox"
      description="Thanks viewers with notification popups."
      key="14">
      <video class="source__demo source__demo--day" autoplay loop slot="media">
        <source src="../../../media/source-demos/day/source-alertbox.mp4">
      </video>
      <video class="source__demo source__demo--night" autoplay loop slot="media">
        <source src="../../../media/source-demos/night/source-alertbox.mp4">
      </video>
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
      description="Show off your most recent donations to your viewers."
      key="15">
      <video class="source__demo source__demo--day" autoplay loop slot="media">
        <source src="../../../media/source-demos/day/source-donation-ticker.mp4">
      </video>
      <video class="source__demo source__demo--night" autoplay loop slot="media">
        <source src="../../../media/source-demos/night/source-donation-ticker.mp4">
      </video>
      <ul slot="support-list" class="source-support__list">
        <li>Donations</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.EventList"
      @clickAdd="selectWidget(widgetTypes.EventList)"
      name="Event List"
      description="Include your channel's most recent events into your stream."
      key="16">
      <video class="source__demo source__demo--day" slot="media" autoplay loop>
        <source src="../../../media/source-demos/day/source-eventlist.mp4">
      </video>
      <video class="source__demo source__demo--night" slot="media" autoplay loop>
        <source src="../../../media/source-demos/night/source-eventlist.mp4">
      </video>
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
      description="Set a goal for your viewers to help you reach."
      key="17">
      <video class="source__demo source__demo--day" slot="media" autoplay loop>
        <source src="../../../media/source-demos/day/source-donation-goal.mp4">
      </video>
      <video class="source__demo source__demo--night" slot="media" autoplay loop>
        <source src="../../../media/source-demos/night/source-donation-goal.mp4">
      </video>
      <ul slot="support-list" class="source-support__list">
        <li>Donations</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.FollowerGoal"
      @clickAdd="selectWidget(widgetTypes.FollowerGoal)"
      name="Follower Goal"
      description="Set a goal for your viewers to help you reach."
      key="18">
      <img class="source__demo source__demo--day" slot="media" src="../../../media/source-demos/day/source-follower-goal.png"/>
      <img class="source__demo source__demo--night" slot="media" src="../../../media/source-demos/night/source-follower-goal.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Twitch Follows</li>
        <li>Youtube Follows</li>
        <li>Mixer Follows</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.BitGoal"
      @clickAdd="selectWidget(widgetTypes.BitGoal)"
      name="Bit Goal"
      description="Set a goal for your viewers to help you reach."
      key="19">
      <img class="source__demo source__demo--day" slot="media" src="../../../media/source-demos/day/source-bit-goal.png"/>
      <img class="source__demo source__demo--night" slot="media" src="../../../media/source-demos/night/source-bit-goal.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Twitch Bits</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.SubscriptionGoal"
      @clickAdd="selectWidget(widgetTypes.SubscriptionGoal)"
      name="Subscription Goal"
      description="Set a goal for your viewers to help you reach."
      key="20">
      <img class="source__demo source__demo--day" slot="media" src="../../../media/source-demos/day/source-follower-goal.png"/>
      <img class="source__demo source__demo--night" slot="media" src="../../../media/source-demos/night/source-follower-goal.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Youtube Subscribers</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.ChatBox"
      @clickAdd="selectWidget(widgetTypes.ChatBox)"
      name="Chatbox"
      description="Include your channel's chat into your stream."
      key="21">
      <video class="source__demo source__demo--day" slot="media" autoplay loop>
        <source src="../../../media/source-demos/day/source-chatbox.mp4">
      </video>
      <video class="source__demo source__demo--night" slot="media" autoplay loop>
        <source src="../../../media/source-demos/night/source-chatbox.mp4">
      </video>
      <ul slot="support-list" class="source-support__list">
        <li>Twitch chat</li>
        <li>Youtube chat</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.TheJar"
      @clickAdd="selectWidget(widgetTypes.TheJar)"
      name="The Jar"
      description="The jar that catches bits, tips, and more."
      key="22">
      <video class="source__demo source__demo--day" slot="media" autoplay loop>
        <source src="../../../media/source-demos/day/source-jar.mp4">
      </video>
      <video class="source__demo source__demo--night" slot="media" autoplay loop>
        <source src="../../../media/source-demos/night/source-jar.mp4">
      </video>
      <ul slot="support-list" class="source-support__list">
        <li>Donations</li>
        <li>Subscriptions</li>
        <li>Follows</li>
        <li>Bits</li>
        <li>Hosts</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.ViewerCount"
      @clickAdd="selectWidget(widgetTypes.ViewerCount)"
      name="Viewer Count"
      description="Show off your viewers from multiple platforms."
      key="23">
      <img class="source__demo source__demo--day" slot="media" src="../../../media/source-demos/day/source-viewer-count.png"/>
      <img class="source__demo source__demo--night" slot="media" src="../../../media/source-demos/night/source-viewer-count.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Youtube</li>
        <li>Twitch</li>
        <li>Mixer</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.StreamBoss"
      @clickAdd="selectWidget(widgetTypes.StreamBoss)"
      name="Stream Boss"
      description="Battle with bits to be the boss of the stream!"
      key="24">
      <img slot="media" src="../../../media/source-demos/streamboss-source.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>Twitch Bits</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.Credits"
      @clickAdd="selectWidget(widgetTypes.Credits)"
      name="Credits"
      description="Rolling credits to play at the end of your stream."
      key="25">
      <video class="source__demo source__demo--day" slot="media" autoplay loop>
        <source src="../../../media/source-demos/day/source-credits.mp4">
      </video>
      <video class="source__demo source__demo--night" slot="media" autoplay loop>
        <source src="../../../media/source-demos/night/source-credits.mp4">
      </video>
      <ul slot="support-list" class="source-support__list">
        <li>New Followers</li>
        <li>New Subscribers</li>
        <li>Cheers</li>
        <li>Donations</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === widgetTypes.SpinWheel"
      @clickAdd="selectWidget(widgetTypes.SpinWheel)"
      name="Spin Wheel"
      description="Spin the wheel to make a decision."
      key="26">
      <video class="source__demo source__demo--day" slot="media" autoplay loop>
        <source src="../../../media/source-demos/day/source-wheel.mp4">
      </video>
      <video class="source__demo source__demo--night" slot="media" autoplay loop>
        <source src="../../../media/source-demos/night/source-wheel.mp4">
      </video>
      <ul slot="support-list" class="source-support__list">
        <li>The streamer manually triggers a spin anytime while they are live.</li>
      </ul>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'scene'"
      @clickAdd="selectSource('scene')"
      name="Scene"
      description="Allows you to add existing scene as a source"
      key="27">
      <img class="source__demo source__demo--day" slot="media" src="../../../media/source-demos/day/scene.png"/>
      <img class="source__demo source__demo--night" slot="media" src="../../../media/source-demos/night/scene.png"/>
    </add-source-info>

    <add-source-info
      v-if="inspectedSource === 'streamlabel'"
      @clickAdd="selectWidget(widgetTypes.StreamLabel)"
      name="Stream Label"
      description="This is a placeholder description for streamlabels."
      key="28">
      <img class="source__demo source__demo--day" slot="media" src="../../../media/source-demos/day/source-stream-labels.png"/>
      <img class="source__demo source__demo--night" slot="media" src="../../../media/source-demos/night/source-stream-labels.png"/>
      <ul slot="support-list" class="source-support__list">
        <li>New Followers</li>
        <li>New Subscribers</li>
        <li>New Cheers</li>
        <li>New Donations</li>
        <li>All-Time Top Donator</li>
        <li>Weekly Top Donator</li>
        <li>Monthly Follows</li>
        <li>Many more</li>
      </ul>
    </add-source-info>

    <div
      class="source-info"
      v-if="inspectedSource === null">
      <div class="source-welcome">
        <div class="source-info__text">
          <h3>Welcome to Sources!</h3>
          <ol>
            <li>Browse through our Standard and Widget Sources</li>
            <li>Click a Source to get more details about it</li>
            <li>Click 'Add Source' when you're ready to add it to your Scene</li>
          </ol>
        </div>
        <div class="source-info__media">
          <img slot="media" class="source__demo source__demo--day" src="../../../media/source-demos/day/sources.png"/>
          <img slot="media" class="source__demo source__demo--night" src="../../../media/source-demos/night/sources.png"/>
        </div>
      </div>
    </div>

    <div class="sources">
      <div class="source-group">
        <h4>Standard</h4>
        <ul class="source-list">
          <li
            v-for="source in availableSources"
            class="source source--standard"
            :class="{'source--active': inspectedSource === source.value}"
            @click="inspectSource(source.value)"
            @dblclick="selectSource(source.value)">
            {{ source.description }}
          </li>
        </ul>
      </div>

      <div class="source-group" v-if="loggedIn">
        <h4>Widgets</h4>
        <div class="source-list">
          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.Alertbox}"
            @click="inspectSource(widgetTypes.AlertBox)"
            @dblclick="selectWidget(widgetTypes.AlertBox)">
            <div>Alertbox</div><span class="label--essential">Essential</span>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.EventList}"
            @click="inspectSource(widgetTypes.EventList)"
            @dblclick="selectWidget(widgetTypes.EventList)">
            <div>Event List</div><span class="label--essential">Essential</span>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.TheJar}"
            @click="inspectSource(widgetTypes.TheJar)"
            @dblclick="selectWidget(widgetTypes.TheJar)">
            <div>The Jar</div><span class="label--essential">Essential</span>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.DonationGoal}"
            @click="inspectSource(widgetTypes.DonationGoal)"
            @dblclick="selectWidget(widgetTypes.DonationGoal)">
            <div>Donation Goal</div>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.FollowerGoal}"
            @click="inspectSource(widgetTypes.FollowerGoal)"
            @dblclick="selectWidget(widgetTypes.FollowerGoal)">
            <div>Follower Goal</div>
          </div>

          <div
            class="source source--widget"
            v-show="platform === 'twitch'"
            :class="{'source--active': inspectedSource === widgetTypes.BitGoal}"
            @click="inspectSource(widgetTypes.BitGoal)"
            @dblclick="selectWidget(widgetTypes.BitGoal)">
            <div>Bit Goal</div>
          </div>

          <div
            class="source source--widget"
            v-show="platform === 'youtube'"
            :class="{'source--active': inspectedSource === widgetTypes.SubscriptionGoal}"
            @click="inspectSource(widgetTypes.SubscriptionGoal)"
            @dblclick="selectWidget(widgetTypes.SubscriptionGoal)">
            <div>Subscription Goal</div>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.DonationTicker}"
            @click="inspectSource(widgetTypes.DonationTicker)"
            @dblclick="selectWidget(widgetTypes.DonationTicker)">
            <div>Donation Ticker</div>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.ChatBox}"
            @click="inspectSource(widgetTypes.ChatBox)"
            @dblclick="selectWidget(widgetTypes.ChatBox)">
            <div>Chatbox</div>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.StreamBoss}"
            @click="inspectSource(widgetTypes.StreamBoss)"
            @dblclick="selectWidget(widgetTypes.StreamBoss)">
            <div>Stream Boss</div>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.Credits}"
            @click="inspectSource(widgetTypes.Credits)"
            @dblclick="selectWidget(widgetTypes.Credits)">
            <div>Credits</div>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.ViewerCount}"
            @click="inspectSource(widgetTypes.ViewerCount)"
            @dblclick="selectWidget(widgetTypes.ViewerCount)">
            <div>Viewer Count</div>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === widgetTypes.SpinWheel}"
            @click="inspectSource(widgetTypes.SpinWheel)"
            @dblclick="selectWidget(widgetTypes.SpinWheel)">
            <div>Spin Wheel</div>
          </div>

          <div
            class="source source--widget"
            :class="{'source--active': inspectedSource === 'streamlabel'}"
            @click="inspectSource('streamlabel')"
            @dblclick="selectSource('text_gdiplus', { propertiesManager: 'streamlabels' })">
            <div>Stream Label</div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-layout-controls">
      <button
        @click="selectInspectedSource()"
        class="button button--action"
        :disabled="inspectedSource === null">
          Add Source
      </button>
    </div>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./SourcesShowcase.vue.ts"></script>

<style lang="less">
@import "../../styles/index";

.source-info {
  padding: 20px;
  border-bottom: 1px solid @day-border;
  display: flex;
  flex-direction: row;
  flex: 0 0 190px;
  height: 190px;
  align-items: center;
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
  position: relative;
  height: 100%;
}

.source-welcome {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
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
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;

  .source {
    &:nth-child(1),
    &:nth-child(2) {
      margin-top: 0;
    }
  }
}

.source {
  color: @navy;
  cursor: pointer;
  .transition;
  border: 1px solid @day-border;
  padding: 4px 10px;
  margin-top: 10px;
  width: 49%;

  &:hover,
  &.source--active {
    color: @navy-secondary;
    .semibold;
    border-color: @day-border;
    background-color: @day-secondary;
  }
}

.source--standard {
  display: inline-block;
}

.source--widget {
  display: flex;
  align-items: center;
  .radius;
  .transition;
}

.source-info__media {
  .radius;
  overflow: hidden;
  text-align: center;
  padding-left: 20px;
  align-items: center;
  align-content: center;
  max-height: 150px;
  justify-content: center;
  display: flex;
  flex: 0 0 50%;

  video,
  img {
    width: auto;
    max-height: 150px;
    max-width: 100%;
    .radius;
  }
}

.source__icon {
  margin-right: 10px;
  width: 30px;
}

.source__demo--day {
  display: block;
}

.source__demo--night {
  display: none;
}

.night-theme {
  .add-source {
    color: @grey;
  }

  .source {
    color: @grey;
    background: @night-hover;
    border-color: @night-hover;

    &:hover,
    &.source--active {
      color: @white;
      border-color: @night-secondary;
      background: @night-secondary;
    }
  }

  .source-group {
    border-color: @night-border;
  }

  .source__demo--day {
    display: none;
  }

  .source__demo--night {
    display: block;
  }

}

</style>