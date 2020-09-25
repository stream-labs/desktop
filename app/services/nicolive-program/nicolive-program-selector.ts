import { StatefulService, mutation } from 'services/stateful-service';

/**
 * 配信する番組種別
 * 配列の並び順は表示順序.
 */
export const providerTypes = ['channel', 'user'] as const;
export type TProviderType = typeof providerTypes[number];

/**
 * 選択肢からなるステップ.
 * 配列の並び順はステップの順序.
 */
export const selectionSteps = ['providerTypeSelect', 'channelSelect', 'programSelect'] as const;
export type TSelectionStep = typeof selectionSteps[number];

/**
 * 最後の「確認」を含めた全ステップ.
 * 配列の並び順はステップの順序.
 */
export const steps = [...selectionSteps, 'confirm'] as const;
export type TStep = typeof steps[number];

/**
 * ステップ名をキーに, その順番(0, 1...)を値にしたオブジェクト.
 * ステップ同士の順序の判定に使用する.
 * ```
 * {
 *   'providerTypeSelect': 0
 *   'channelSelect': 1, 
 *   // ...
 * }
 * ```
 */
const stepsMap = steps.reduce<{ [key in TStep]?: number }>((prev, current, index) => (
  { ...prev, [current]: index }), {}
) as { [key in TStep]: number };

export interface INicoliveProgramSelectorState {
  selectedProviderType: TProviderType | null;
  selectedChannel: { id: string; name: string } | null;
  selectedProgram: { id: string; title?: string } | null; // ユーザー番組の場合はタイトルは取得せず undefined のまま
  candidatePrograms: { id: string; title: string }[];
  isLoading: boolean;
  currentStep: TStep;
}

export class NicoliveProgramSelectorService extends StatefulService<INicoliveProgramSelectorState> {

  static initialState: INicoliveProgramSelectorState = {
    selectedProviderType: null,
    selectedChannel: null,
    selectedProgram:  null,
    candidatePrograms: [],
    isLoading: false,
    currentStep: 'providerTypeSelect'
  };

  init() {
    super.init();
  }

  onSelectProviderTypeChannel() {
    if (this.state.currentStep !== 'providerTypeSelect') {
      return;
    }
    this.SET_STATE({
      selectedProviderType: 'channel',
      currentStep: 'channelSelect'
    });
  }

  onSelectProviderTypeUser(userProgramId: string) {
    if (this.state.currentStep !== 'providerTypeSelect') {
      return;
    }
    this.SET_STATE({
      selectedProviderType: 'user',
      selectedChannel: null,
      selectedProgram: { id: userProgramId },
      currentStep: 'confirm'
    });
  }

  /**
   * 配信先チャンネルを選択したときの処理.
   * 番組選択ステップへ移動後, APIを叩いて番組IDからタイトルを解決し, candidatePrograms に番組IDとタイトルを保存する.
   * @param id 配信するチャンネルID (chXXXX)
   * @param name 配信するチャンネル名
   * @param broadcastablePrograms 配信可能な番組 の一覧
   */
  onSelectChannel(id: string, name: string, broadcastablePrograms: { id: string }[]) {
    if(this.state.currentStep !== 'channelSelect') {
      return;
    }
    this.SET_STATE({
      selectedChannel: { id, name },
      currentStep: 'programSelect',
      candidatePrograms: [],
      isLoading: true
    });
    // TODO: API から番組タイトルを取得するようにする. 現在は仮のタイトルを指定.
    const candidatePrograms = broadcastablePrograms.map(program => ({
      id: program.id,
      title: `これは ${program.id} のタイトルです`
    }));
    // ↑ ここまで仮の処理
    this.SET_STATE({
      candidatePrograms,
      isLoading: false
    });
  }

  onSelectBroadcastingProgram(id: string, title: string) {
    if(this.state.currentStep !== 'programSelect') {
      return;
    }
    this.SET_STATE({
      selectedProgram: { id, title },
      currentStep: 'confirm'
    });
  }

  /**
   * 与えられたステップが現在のステップもしくはすでに完了したステップであるか.
   * @param step
   */
  isCompletedOrCurrentStep(step: TStep): boolean {
    if (this.isStepToSkip(step, this.state.selectedProviderType)) {
      return false;
    }
    return stepsMap[this.state.currentStep] >= stepsMap[step];
  }

  /**
   * 与えられたステップがすでに完了したステップであるか.
   * @param step 
   */
  isCompletedStep(step: TStep): boolean {
    if (this.isStepToSkip(step, this.state.selectedProviderType)) {
      return false;
    }
    return stepsMap[this.state.currentStep] > stepsMap[step];
  }

  /**
   * 指定ステップに戻る.
   * 指定ステップ以降で設定された値は初期値にリセットする.
   * 完了していないステップが与えられた場合は何もしない.
   * @param step 
   */
  backTo(step: TStep) {
    if (!this.isCompletedStep(step)) {
      return;
    }
    this.SET_STATE({
      currentStep: step,
      candidatePrograms: stepsMap[step] <= stepsMap['channelSelect'] ? [] : this.state.candidatePrograms,
      selectedProviderType: stepsMap[step] <= stepsMap['providerTypeSelect'] ? null : this.state.selectedProviderType,
      selectedChannel: stepsMap[step] <= stepsMap['channelSelect'] ? null : this.state.selectedChannel,
      selectedProgram: stepsMap[step] <= stepsMap['programSelect']  ? null : this.state.selectedProgram,
    });
  }

  /**
   * ユーザー生放送が選択されている場合,
   * 与えられたステップがスキップされるべきものなら true を, さもなくば false を返す.
   * チャンネル生放送が選択されている場合, 常に false を返す.
   * @param step 
   * @param providerType 
   */
  private isStepToSkip(step: TStep, providerType: TProviderType): boolean {
    return (
      providerType === 'user' && (
        step === 'programSelect' || step === 'channelSelect'
      )
    );
  }

  @mutation()
  private SET_STATE(nextState: Partial<INicoliveProgramSelectorState>) {
    this.state = { ...this.state, ...nextState };
  }
}
