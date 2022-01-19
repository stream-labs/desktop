import Vue from 'vue';
import { $t } from 'services/i18n';
import { Inject } from 'services/core/injector';
import { NicoliveProgramService } from 'services/nicolive-program/nicolive-program';

export default class ProgramStatistics extends Vue {
  @Inject()
  nicoliveProgramService: NicoliveProgramService;

  visitorTooltip = $t('common.numberOfVisitors');
  commentTooltip = $t('common.numberOfComments');
  adPointTooltip = $t('common.numberOfadPoint');
  giftPointTooltip = $t('common.numberOfgiftPoint');
  twitterShareTooltip = $t('common.twitter');

  get viewers(): number {
    return this.nicoliveProgramService.state.viewers;
  }

  get comments(): number {
    return this.nicoliveProgramService.state.comments;
  }

  get adPoint(): number {
    return this.nicoliveProgramService.state.adPoint;
  }

  get giftPoint(): number {
    return this.nicoliveProgramService.state.giftPoint;
  }
}
