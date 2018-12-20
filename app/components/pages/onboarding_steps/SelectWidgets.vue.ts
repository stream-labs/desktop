import Vue from 'vue';
import { without, defer } from 'lodash';
import { Component } from 'vue-property-decorator';
import { WidgetsService, WidgetType } from '../../../services/widgets';
import { Inject } from '../../../util/injector';
import { OnboardingService } from '../../../services/onboarding';
import { UserService } from '../../../services/user';
import SelectableWidget from './SelectableWidget.vue';

@Component({
  components: { SelectableWidget },
})
export default class SelectWidgets extends Vue {
  @Inject()
  widgetsService: WidgetsService;

  @Inject()
  onboardingService: OnboardingService;

  @Inject()
  userService: UserService;

  // We can't access TypeScript enums in the Vue template, so
  // accessing them through the Vue instance is a workaround.
  widgetTypes = WidgetType;

  inspectedWidget: WidgetType = null;

  busy = false;

  selectedWidgets: WidgetType[] = [];

  created() {
    if (!this.onboardingService.state.completedSteps.includes('ObsImport')) {
      this.selectedWidgets = [WidgetType.AlertBox];
    }
  }

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

  get platform() {
    return this.userService.platform.type;
  }

  skip() {
    this.onboardingService.skip();
  }
}
