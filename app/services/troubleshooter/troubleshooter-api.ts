import { TFormData } from '../../components/shared/forms/Input';

export interface ITroubleshooterSettings {
  skippedThreshold: number;
  laggedThreshold: number;
  droppedThreshold: number;
}

export type TIssueCode = 'FRAMES_LAGGED' | 'FRAMES_SKIPPED' | 'FRAMES_DROPPED';

export interface ITroubleshooterServiceApi {
  getSettings(): ITroubleshooterSettings;
  getSettingsFormData(): TFormData;
  setSettings(settingsPatch: Partial<ITroubleshooterSettings>): void;
  restoreDefaultSettings(): void;
  showTroubleshooter(issueCode: TIssueCode): void;
}
