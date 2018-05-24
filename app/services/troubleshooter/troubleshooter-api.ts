import { TFormData } from '../../components/shared/forms/Input';

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
  getSettingsFormData(): TFormData;
  setSettings(settingsPatch: Partial<ITroubleshooterSettings>): void;
  restoreDefaultSettings(): void;
  showTroubleshooter(issueCode: TIssueCode): void;
}
