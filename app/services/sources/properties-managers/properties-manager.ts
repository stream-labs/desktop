import * as input from 'components/shared/forms/Input';
import * as obs from '../../../../obs-api';


/**
 * This is the interface that the rest of the app uses
 * to interact with property managers in a generic way.
 */
export interface IPropertyManager {
  destroy(): void;
  getPropertiesFormData(): input.TFormData;
  setPropertyFormData(property: TCustomProperty |
    input.IFormInput<input.TObsValue> |
    input.IListInput<input.TObsValue>): void;
  settings: Dictionary<any>;
}


export interface ICustomProperty<TValue> extends input.IFormInput<TValue> {
  isCustom: true;
}


export interface ICustomListProperty<TValue> extends ICustomProperty<TValue> {
  options: input.IListOption<TValue>[];
}


export type TCustomProperty = ICustomProperty<input.TObsValue> | ICustomListProperty<input.TObsValue>;


/**
 * A property manager is a class that manages the source
 * properties for a particular source.  It shares the same
 * lifetime of the source, and may automatically change
 * settings on the source if it wants to.  It is also
 * responsible for deciding which properties are exposed
 * to the user, and injecting additional properties if
 * needed.
 */
export abstract class PropertiesManager implements IPropertyManager {

  /**
   * Create a new properties manager
   * @param obsSource The source this class manages
   * @param settings The manager settings.  These are *NOT* OBS settings
   */
  constructor(public obsSource: obs.ISource, public settings: Dictionary<any>) {
  }


  /**
   * Can be used to attach custom teardown behavior to this
   * properties manager.
   */
  destroy() {
  }


  /**
   * The blacklist is a list of OBS property names that
   * should not be displayed to the user.
   */
  blacklist: string[] = [];


  /**
   * displayOrder will be used as a list of property
   * names (custom or OBS) to used when ordering
   * properties displayed to the user.  Properties not
   * appearing in the list will be shown at the end in the
   * order they are defined, with custom properties first,
   * followed by OBS properties.
   */
  displayOrder: string[] = [];


  /**
   * Returns a list of custom properties to be shown
   * to the user.  The property names should not conflict
   * with OBS property names.
   */
  getCustomProperties(): TCustomProperty[] {
    return [];
  }


  /**
   * Should handle custom logic for settting custom properties.
   * This function will not be called for OBS properties.
   * @param property The custom property being set
   */
  setCustomProperty(property: TCustomProperty) {
  }


  getPropertiesFormData(): input.TFormData {
    const obsProperties = input.getPropertiesFormData(this.obsSource);
    const customProperties = this.getCustomProperties();
    let propsArray: input.TFormData = [];

    // First, add properties that appear in the display order
    this.displayOrder.forEach(name => {
      const customIndex = customProperties.findIndex(prop => prop.name === name);

      if (customIndex !== -1) {
        propsArray.push(customProperties[customIndex]);
        customProperties.splice(customIndex, 1);
      }

      const obsIndex = obsProperties.findIndex(prop => prop.name === name);

      if (obsIndex !== -1) {
        propsArray.push(obsProperties[obsIndex]);
        obsProperties.splice(obsIndex, 1);
      }
    });

    propsArray = propsArray.concat(customProperties).concat(obsProperties);
    propsArray = propsArray.filter(prop => !this.blacklist.includes(prop.name));

    console.log(propsArray);

    return propsArray;
  }


  setPropertyFormData(property: TCustomProperty |
    input.IFormInput<input.TObsValue> |
    input.IListInput<input.TObsValue>) {

    if ((property as TCustomProperty).isCustom) {
      this.setCustomProperty(property as TCustomProperty);
    } else {
      input.setPropertiesFormData(this.obsSource, [property]);
    }
  }

}
