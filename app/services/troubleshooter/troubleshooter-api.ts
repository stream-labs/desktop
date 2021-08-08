export interface ITroubleshooterSettings {
  skippedEnabled: boolean;
  skippedThreshold: number;
  laggedEnabled: boolean;
  laggedThreshold: number;
  droppedEnabled: boolean;
  droppedThreshold: number;
}

export type TIssueCode = 'FRAMES_LAGGED' | 'FRAMES_SKIPPED' | 'FRAMES_DROPPED';

export interface ITroubleshooterServiceApi {
  getSettings(): ITroubleshooterSettings;
  setSettings(settingsPatch: Partial<ITroubleshooterSettings>): void;
  restoreDefaultSettings(): void;
  showTroubleshooter(issueCode: TIssueCode): void;
}
