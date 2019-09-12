import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import ModalLayout from 'components/ModalLayout.vue';
import TsxComponent from 'components/tsx-component';
import { $t } from 'services/i18n';
import { WindowsService } from 'services/windows';
import { RecentEventsService } from 'services/recent-events';

@Component({})
export default class EventFilterMenu extends TsxComponent<{}> {
  @Inject() windowsService: WindowsService;
  @Inject() recentEventsService: RecentEventsService;

  reset() {
    return;
  }

  cancel() {
    this.windowsService.closeChildWindow();
  }

  get filters() {
    console.log(this.recentEventsService.state.filterConfig);
    return this.recentEventsService.state.filterConfig;
  }

  render(h: Function) {
    return (
      <ModalLayout customControls showControls={false}>
        <div slot="content">
          {Object.keys(this.filters).map(filter => (
            <p>{filter}</p>
          ))}
        </div>
        <div slot="controls">
          <button class="button button--default" onClick={this.reset}>
            {$t('Reset')}
          </button>
          <button class="button button--action" onClick={this.cancel}>
            {$t('Done')}
          </button>
        </div>
      </ModalLayout>
    );
  }
}
