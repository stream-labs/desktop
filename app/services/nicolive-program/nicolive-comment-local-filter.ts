import { mutation, StatefulService } from 'services/stateful-service';
import { ChatMessage } from './MessageServerClient';
import { isAnonymous, getScore } from './ChatMessage/util';

export type NGSharingLevel = 'none' | 'low' | 'mid' | 'high';

interface INicoliveCommentLocalFilterState {
  level: NGSharingLevel;
  showAnonymous: boolean;
}

const LEVEL_TABLE = {
  none: -Infinity,
  low: -10000,
  mid: -4800,
  high: -1000,
};

export class NicoliveCommentLocalFilterService extends StatefulService<INicoliveCommentLocalFilterState> {
  static initialState = {
    level: 'none',
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

  filter = (message: ChatMessage): boolean => {
    const ngSharingOk = this.threshold < getScore(message);
    const anonymityOk = this.showAnonymous || !isAnonymous(message);
    return ngSharingOk && anonymityOk;
  };

  @mutation() private SET_LEVEL(level: NGSharingLevel) {
    this.state = { ...this.state, level };
  }

  @mutation() private SET_SHOW_ANONYMOUS(showAnonymous: boolean) {
    this.state = { ...this.state, showAnonymous };
  }
}
