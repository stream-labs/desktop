import { IWidgetData } from 'services/widgets';
import { IAlertBoxSettings } from './alert-box-api';

export interface IAlertBoxData extends IWidgetData {
  settings: IAlertBoxSettings;
  custom: { js: string; html: string; css: string };
  tts_languages?: any[];
}
