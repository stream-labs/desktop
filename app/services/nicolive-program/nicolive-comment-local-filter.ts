import { PersistentStatefulService } from 'services/persistent-stateful-service';
import { mutation } from 'services/stateful-service';
import { isAnonymous, getScore } from './ChatMessage/util';
import { ChatMessage } from './MessageServerClient';

export type NGSharingLevel = 'none' | 'low' | 'mid' | 'high';

interface INicoliveCommentLocalFilterState {
  level: NGSharingLevel;
  showAnonymous: boolean;
}

const LEVEL_TABLE = {
  // Number.NEGATIVE_INFINITY はJSONにできない
  none: Number.MIN_SAFE_INTEGER,
  low: -10000,
  mid: -4800,
  high: -1000,
};

export class NicoliveCommentLocalFilterService extends PersistentStatefulService<INicoliveCommentLocalFilterState> {
  static defaultState = {
    level: 'mid',
    showAnonymous: true,
  };

  static get NG_SHARING_LEVELS(): NGSharingLevel[] {
    return ['none', 'low', 'mid', 'high'];
  }

  private get threshold() {
    return LEVEL_TABLE[this.state.level];
  }

  get level() {
    return this.state.level;
  }

  set level(level: NGSharingLevel) {
    this.SET_LEVEL(level);
  }

  get showAnonymous() {
    return this.state.showAnonymous;
  }

  set showAnonymous(showAnonymous: boolean) {
    this.SET_SHOW_ANONYMOUS(showAnonymous);
  }

  get filterFn() {
    return (message: ChatMessage): boolean => {

      const ngSharingOk = this.threshold < getScore(message);
      if (!ngSharingOk) return false;

      const anonymityOk = this.showAnonymous || !isAnonymous(message);
      if (!anonymityOk) return false;

      return true;
    };
  }

  @mutation() private SET_LEVEL(level: NGSharingLevel) {
    this.state = { ...this.state, level };
  }

  @mutation() private SET_SHOW_ANONYMOUS(showAnonymous: boolean) {
    this.state = { ...this.state, showAnonymous };
  }
}
