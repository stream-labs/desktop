import { PersistentStatefulService } from 'services/persistent-stateful-service';
import { mutation } from '../stateful-service';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

interface IState {
  autoExtensionEnabled: boolean;
  panelOpened: boolean;
}

/**
 * ニコ生配信機能に関する永続化したい状態を管理するService
 */
export class NicoliveProgramStateService extends PersistentStatefulService<IState> {
  static defaultState = {
    autoExtensionEnabled: false,
    panelOpened: true,
  };

  private subject: Subject<IState> = new BehaviorSubject<IState>(this.state);
  updated: Observable<IState> = this.subject.asObservable();

  toggleAutoExtension(): void {
    this.setState({ autoExtensionEnabled: !this.state.autoExtensionEnabled });
  }

  togglePanelOpened(): void {
    this.setState({ panelOpened: !this.state.panelOpened });
  }

  private setState(nextState: Partial<IState>): void {
    const newState = { ...this.state, ...nextState };
    this.SET_STATE(newState);
    this.subject.next(newState);
  }

  @mutation()
  private SET_STATE(nextState: IState): void {
    this.state = nextState;
  }
}
