import { IObsListInput, IObsTextInputValue, TObsFormData, TObsValue } from "components/obs/inputs/ObsInput";
import { PropertiesManager } from "./properties-manager";
import { $t } from "services/i18n";

export class CustomCastNdiManager extends PropertiesManager {
  getPropertiesFormData(): TObsFormData {
    const propArray = super.getPropertiesFormData();
    const ndiSourceNamePropIndex = propArray.findIndex(
      prop => prop.name === 'ndi_source_name',
    );

    if (ndiSourceNamePropIndex !== -1) {
      const ndiSourceNameProp = propArray[ndiSourceNamePropIndex] as IObsListInput<TObsValue>;

      // NDIソース選択を禁止する
      ndiSourceNameProp.enabled = false;

      const re = /.* \(CUSTOMCAST\)/;
      const customCastNdi = ndiSourceNameProp.options.find(option => {
        return (typeof option.value === 'string') && option.value.match(re);
      });

      if (customCastNdi === undefined) {
        // CUSTOMCAST NDIが見つからないときは案内メッセージを付ける
        return [{
          type: 'OBS_PROPERTY_TEXT',
          name: 'custom_cast_ndi_not_found',
          description: $t('source-props.custom_cast_ndi_source.custom_cast_ndi_not_found'),
          visible: true,
          multiline: false,
          info: true,
        } as IObsTextInputValue];
      }

      // CUSTOMCAST NDIを強制選択する
      const ndi_source_name = customCastNdi.value;
      if (this.obsSource.settings['ndi_source_name'].value !== ndi_source_name) {
        this.obsSource.update({ ndi_source_name });
      }
    }
    return propArray;
  }
}
