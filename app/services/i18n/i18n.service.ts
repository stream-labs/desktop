
import { PersistentStatefulService } from '../persistent-stateful-service';
import { mutation } from '../stateful-service';

interface II18nState {
  lang: string;
}

export class I18nService extends PersistentStatefulService<II18nState> {

  static defaultState: II18nState = {
    lang: 'en-US'
  };

}
