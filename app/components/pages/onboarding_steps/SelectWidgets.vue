<template>
  <div>
    <div class="onboarding-step onboarding-step--wide">
      <div class="onboarding-title">{{ $t('Add Widgets') }}</div>
      <div class="onboarding-desc">
        {{ $t('Select the Streamlabs widgets you would like to activate for your stream. These will get automatically added to your scene.') }}
      </div>
      <div class="select-widgets">
        <div class="select-widgets__column">
          <div class="select-widgets__column-title">Essentials</div>
          <div class="select-widgets__widgets">
            <selectable-widget
              :selected="selectedWidgets.includes(widgetTypes.AlertBox)"
              :inspected="inspectedWidget === widgetTypes.AlertBox"
              name="Alertbox"
              :description="$t('Thanks viewers with notification popups')"
              @toggle="toggleWidget(widgetTypes.AlertBox)"
              @inspect="inspectWidget(widgetTypes.AlertBox)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/alertbox.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/alertbox.mp4"></video>
            </selectable-widget>

            <selectable-widget
              :selected="selectedWidgets.includes(widgetTypes.EventList)"
              :inspected="inspectedWidget === widgetTypes.EventList"
              name="Event List"
              :description="$t('Most recent events into your stream')"
              @toggle="toggleWidget(widgetTypes.EventList)"
              @inspect="inspectWidget(widgetTypes.EventList)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/event-list.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/eventlist.mp4"></video>
            </selectable-widget>

            <selectable-widget
              :selected="selectedWidgets.includes(widgetTypes.TipJar)"
              :inspected="inspectedWidget === widgetTypes.TipJar"
              name="The Jar"
              :description="$t('A jar that catches bits, tips, and more')"
              @toggle="toggleWidget(widgetTypes.TipJar)"
              @inspect="inspectWidget(widgetTypes.TipJar)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/jar.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/jar.mp4"></video>
            </selectable-widget>
          </div>
        </div>

        <div class="select-widgets__column">
          <div class="select-widgets__column-title">Additional</div>
          <div class="select-widgets__widgets">
            <selectable-widget
              :selected="selectedWidgets.includes(widgetTypes.ChatBox)"
              :inspected="inspectedWidget === widgetTypes.ChatBox"
              name="Chatbox"
              :description="$t('Your channel\'s chat in your stream')"
              @toggle="toggleWidget(widgetTypes.ChatBox)"
              @inspect="inspectWidget(widgetTypes.ChatBox)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/chatbox.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/chatbox.mp4"></video>
            </selectable-widget>

            <selectable-widget
              :selected="selectedWidgets.includes(widgetTypes.DonationTicker)"
              :inspected="inspectedWidget === widgetTypes.DonationTicker"
              name="Donation Ticker"
              :description="$t('Show off most recent donations to viewers')"
              @toggle="toggleWidget(widgetTypes.DonationTicker)"
              @inspect="inspectWidget(widgetTypes.DonationTicker)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/donation-ticker.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/donation-ticker.mp4"></video>
            </selectable-widget>

            <selectable-widget
              :selected="selectedWidgets.includes(widgetTypes.DonationGoal)"
              :inspected="inspectedWidget === widgetTypes.DonationGoal"
              name="Donation Goal"
              :description="$t('Give your viewers a donation target to help you reach')"
              @toggle="toggleWidget(widgetTypes.DonationGoal)"
              @inspect="inspectWidget(widgetTypes.DonationGoal)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/donation-goal.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/donation-goal.mp4"></video>
            </selectable-widget>

            <selectable-widget
              v-show="platform === 'twitch'"
              :selected="selectedWidgets.includes(widgetTypes.FollowerGoal)"
              :inspected="inspectedWidget === widgetTypes.FollowerGoal"
              name="Follower Goal"
              :description="$t('Give your viewers a follower target to help you reach')"
              @toggle="toggleWidget(widgetTypes.FollowerGoal)"
              @inspect="inspectWidget(widgetTypes.FollowerGoal)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/donation-goal.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/donation-goal.mp4"></video>
            </selectable-widget>

            <selectable-widget
              v-show="platform === 'twitch'"
              :selected="selectedWidgets.includes(widgetTypes.BitGoal)"
              :inspected="inspectedWidget === widgetTypes.BitGoal"
              name="Bit Goal"
              :description="$t('Give your viewers a bit target to help you reach')"
              @toggle="toggleWidget(widgetTypes.BitGoal)"
              @inspect="inspectWidget(widgetTypes.BitGoal)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/donation-goal.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/donation-goal.mp4"></video>
            </selectable-widget>

            <selectable-widget
              v-show="platform === 'facebook'"
              :selected="selectedWidgets.includes(widgetTypes.StarsGoal)"
              :inspected="inspectedWidget === widgetTypes.StarsGoal"
              name="Stars Goal"
              :description="$t('Give your viewers a stars target to help you reach')"
              @toggle="toggleWidget(widgetTypes.StarsGoal)"
              @inspect="inspectWidget(widgetTypes.StarsGoal)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/donation-goal.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/donation-goal.mp4"></video>
            </selectable-widget>

            <selectable-widget
              v-show="platform === 'facebook'"
              :selected="selectedWidgets.includes(widgetTypes.SupporterGoal)"
              :inspected="inspectedWidget === widgetTypes.SupporterGoal"
              name="Supporter Goal"
              :description="$t('Give your viewers a supporter target to help you reach')"
              @toggle="toggleWidget(widgetTypes.SupporterGoal)"
              @inspect="inspectWidget(widgetTypes.SupporterGoal)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/donation-goal.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/donation-goal.mp4"></video>
            </selectable-widget>

            <selectable-widget
              v-show="platform === 'youtube'"
              :selected="selectedWidgets.includes(widgetTypes.SubscriberGoal)"
              :inspected="inspectedWidget === widgetTypes.SubscriberGoal"
              name="Subscriber Goal"
              :description="$t('Give your viewers a subscriber target to help you reach')"
              @toggle="toggleWidget(widgetTypes.SubscriberGoal)"
              @inspect="inspectWidget(widgetTypes.SubscriberGoal)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/donation-goal.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/donation-goal.mp4"></video>
            </selectable-widget>

            <selectable-widget
              :selected="selectedWidgets.includes(widgetTypes.ViewerCount)"
              :inspected="inspectedWidget === widgetTypes.ViewerCount"
              name="Viewer Count"
              :description="$t('Show off how many viewers you have from multiple platforms')"
              @toggle="toggleWidget(widgetTypes.ViewerCount)"
              @inspect="inspectWidget(widgetTypes.ViewerCount)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/viewer-count.png">
              <img slot="body" src="../../../../media/images/viewercount.png"/>
            </selectable-widget>

            <selectable-widget
              :selected="selectedWidgets.includes(widgetTypes.StreamBoss)"
              :inspected="inspectedWidget === widgetTypes.StreamBoss"
              name="Stream Boss"
              :description="$t('Give your viewers an opportunity of becoming a boss')"
              @toggle="toggleWidget(widgetTypes.StreamBoss)"
              @inspect="inspectWidget(widgetTypes.StreamBoss)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/streamboss.png">
              <img slot="body" src="../../../../media/images/streamboss-stream.png"/>
            </selectable-widget>

            <selectable-widget
              :selected="selectedWidgets.includes(widgetTypes.Credits)"
              :inspected="inspectedWidget === widgetTypes.Credits"
              name="Credits"
              :description="$t('Rolling credits at the end of your stream')"
              @toggle="toggleWidget(widgetTypes.Credits)"
              @inspect="inspectWidget(widgetTypes.Credits)"
              @close="closeInspection">
              <img slot="icon" src="../../../../media/images/icons/end-credits.png">
              <video slot="body" autoplay loop muted src="../../../../media/mp4/credits-stream.mp4"></video>
            </selectable-widget>
          </div>
        </div>
      </div>
      <button
        :disabled="busy"
        class="button button--lg button--action"
        @click="next">
        {{ $t('Add %{widgetscount} Widgets', { widgetscount:  selectedWidgets.length}) }}
      </button>
      <div class="setup-later">
        <span>{{ $t('Rather do this manually?') }}</span>
        <a @click="skip">{{ $t('Setup later')}}</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" src="./SelectWidgets.vue.ts"></script>

<style lang="less" scoped>
@import "../../../styles/index";

.select-widgets {
  display: flex;
  flex-direction: column;
  margin: 20px 0;

  .select-widgets__column {
    &:first-child {
      .select-widgets__widgets {
        margin-bottom: 40px;
      }
    }
  }
}

.select-widgets__column {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-content: center;
  align-items: center;
}

.select-widgets__column-title {
  .weight(@medium);
  color: var(--white);
  font-size: 14px;
}

.select-widgets__widgets {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;

  div {
    width: 300px;
  }
}
</style>
