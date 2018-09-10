import { IWidgetApiSettings, IWidgetData, WidgetSettingsService } from './widget-settings';


interface IBaseGoalData extends IWidgetData {
  goal: Dictionary<any>
}

interface IGoalWidgetApiSettings extends IWidgetApiSettings {
  goalUrl: string;
  goalResetUrl?: string; // if not set use `goalUrl`
}

export abstract class BaseGoalService<TGoalData extends IBaseGoalData, TGoalCreateOptions>
  extends WidgetSettingsService<TGoalData>
{

  abstract getApiSettings(): IGoalWidgetApiSettings;

  protected patchAfterFetch(data: TGoalData): TGoalData {
    // fix a bug when API returning an empty array instead of null
    if (Array.isArray(data.goal)) data.goal = null;
    return data;
  }

  async saveGoal(options: TGoalCreateOptions) {
    const apiSettings = this.getApiSettings();
    return await this.request({
      url: apiSettings.goalUrl,
      method: 'POST',
      body: options
    });
  }

  async resetGoal() {
    const apiSettings = this.getApiSettings();

    if (apiSettings.goalResetUrl) {
      return await this.request({
        url: apiSettings.goalResetUrl,
        method: 'POST'
      });
    }

    return await this.request({
      url: apiSettings.goalUrl,
      method: 'DELETE'
    });
  }

}
