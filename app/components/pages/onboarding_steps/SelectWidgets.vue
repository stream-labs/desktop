<template>
  <div>
    <div class="onboarding-step onboarding-step--wide">
      <div class="onboarding-title">Select Widgets</div>
      <div class="onboarding-desc">
        Select the Streamlabs widgets you would like to activate for your stream. Whether it's donation alerts, the jar, or stream labels, we have you covered with a host of widgets.
      </div>
      <div class="select-widgets">
        <div class="select-widgets__column">
          <div class="select-widgets__column-title">Essentials</div>
          <selectable-widget
            :selected="selectedWidgets.includes(widgetTypes.AlertBox)"
            :inspected="inspectedWidget === widgetTypes.AlertBox"
            name="Alertbox"
            description="Thanks viewers with notification popups"
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
            description="Most recent events into your stream"
            @toggle="toggleWidget(widgetTypes.EventList)"
            @inspect="inspectWidget(widgetTypes.EventList)"
            @close="closeInspection">
            <img slot="icon" src="../../../../media/images/icons/event-list.png">
            <video slot="body" autoplay loop muted src="../../../../media/mp4/eventlist.mp4"></video>
          </selectable-widget>
          <selectable-widget
            :selected="selectedWidgets.includes(widgetTypes.TheJar)"
            :inspected="inspectedWidget === widgetTypes.TheJar"
            name="The Jar"
            description="A jar that catches bits, tips, and more"
            @toggle="toggleWidget(widgetTypes.TheJar)"
            @inspect="inspectWidget(widgetTypes.TheJar)"
            @close="closeInspection">
            <img slot="icon" src="../../../../media/images/icons/jar.png">
            <video slot="body" autoplay loop muted src="../../../../media/mp4/jar.mp4"></video>
          </selectable-widget>
        </div>
        <div class="select-widgets__column">
          <div class="select-widgets__column-title">Additional</div>
          <selectable-widget
            :selected="selectedWidgets.includes(widgetTypes.ChatBox)"
            :inspected="inspectedWidget === widgetTypes.ChatBox"
            name="Chatbox"
            description="Your channel's chat in your stream"
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
            description="Show off most recent donations to viewers"
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
            description="Give your viewers a target to help you reach"
            @toggle="toggleWidget(widgetTypes.DonationGoal)"
            @inspect="inspectWidget(widgetTypes.DonationGoal)"
            @close="closeInspection">
            <img slot="icon" src="../../../../media/images/icons/donation-goal.png">
            <video slot="body" autoplay loop muted src="../../../../media/mp4/donation-goal.mp4"></video>
          </selectable-widget>
        </div>
      </div>
      <button
        :disabled="busy"
        class="button button--lg button--action"
        @click="next">
        Next
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { without, defer } from 'lodash';
import { Component } from 'vue-property-decorator';
import { WidgetsService, WidgetType } from '../../../services/widgets';
import { Inject } from '../../../services/service';
import { OnboardingService } from '../../../services/onboarding';
import SelectableWidget from './SelectableWidget.vue';

@Component({
  components: { SelectableWidget }
})
export default class SelectWidgets extends Vue {

  @Inject()
  widgetsService: WidgetsService;

  @Inject()
  onboardingService: OnboardingService;

  // We can't access TypeScript enums in the Vue template, so
  // accessing them through the Vue instance is a workaround.
  widgetTypes = WidgetType;

  inspectedWidget: WidgetType = null;

  busy = false;

  selectedWidgets: WidgetType[] = [
    WidgetType.AlertBox,
    WidgetType.EventList,
    WidgetType.TheJar
  ];

  // SelectableWidget components with inspect=true will
  // pop up a full screen modal.  This function can be
  // used to pop up a single inspect modal at a time.
  inspectWidget(widget: WidgetType) {
    this.inspectedWidget = widget;
  }

  // Ensures no inspection modals are popped up.
  closeInspection() {
    this.inspectedWidget = null;
  }

  toggleWidget(widget: WidgetType) {
    if (this.selectedWidgets.includes(widget)) {
      this.selectedWidgets = without(this.selectedWidgets, widget);
    } else {
      this.selectedWidgets.push(widget);
    }
  }

  next() {
    if (!this.busy) {
      this.busy = true;

      defer(() => {
        // This operation can be a little slow
        this.selectedWidgets.forEach(widget => {
          this.widgetsService.createWidget(widget);
        });

        this.onboardingService.next();
      });
    }
  }

}
</script>

<style lang="less" scoped>
@import "../../../styles/index";

.select-widgets {
  display: flex;
  margin: 20px 0;
}

.select-widgets__column {
  padding: 0 15px;
}

.select-widgets__column-title {
  .semibold;
  color: @white;
  font-size: 14px;
}
</style>
