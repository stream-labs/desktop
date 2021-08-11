import { PersistentStatefulService } from 'services/core/persistent-stateful-service';
import { mutation } from '../core/stateful-service';
import { Subject, BehaviorSubject, Observable } from 'rxjs';

type SpeechSynthesizerSettingsState = {
  enabled: boolean;
  pitch: number;
  rate: number;
  volume: number;
};

interface IState {
  autoExtensionEnabled: boolean;
  panelOpened: boolean;
  speechSynthesizerSettings?: SpeechSynthesizerSettingsState;
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

  updateSpeechSynthesizerSettings(newState: SpeechSynthesizerSettingsState): void {
    this.setState({ speechSynthesizerSettings: newState });
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
