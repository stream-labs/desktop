import { StatefulService } from './stateful-service';
import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs;

export default class SourceFiltersService extends StatefulService {


  static initialState = {
    availableTypes: nodeObs.OBS_content_getListFilters()
  }


  add(sourceName, filterType, filterName) {
    nodeObs.OBS_content_addSourceFilter(sourceName, filterType, filterName);
  }


  remove(sourceName, filterName) {
    nodeObs.OBS_content_removeSourceFilter(sourceName, filterName);
  }


  setProperties(sourceName, filterName, properties) {
    for (const prop of properties) {
      let value = prop.currentValue;
      if (prop.type === 'OBS_PROPERTY_BOOL') {
        value = value === 1 ? 'true' : 'false';
      } else if (prop.type === 'OBS_PROPERTY_INT') {
        value = String(value);
      }
      nodeObs.OBS_content_setSourceFilterProperty(sourceName, filterName, prop.name, { value });
    }
  }


  getFiltersNames(sourceName) {
    return nodeObs.OBS_content_getListSourceFilters(sourceName);
  }


  getAddNewFormData() {
    return {
      type: {
        description: 'Filter type',
        name: 'type',
        currentValue: this.state.availableTypes[0].type,
        values: this.state.availableTypes.map(({ type, description }) => {
          return { [description]: type };
        })
      },
      name: {
        description: 'Filter name',
        name: 'name',
        currentValue: 'New filter'
      }
    };
  }


  getPropertiesFormData(sourceName, filterName) {
    const properties = nodeObs.OBS_content_getSourceFilterProperties(sourceName, filterName);
    if (!properties) return [];
    // patch currentValue for corresponding to common properties format
    for (const property of properties) {
      property.currentValue = nodeObs.OBS_content_getSourceFilterPropertyCurrentValue(
        sourceName, filterName, property.name
      ).value;
      if (property.type === 'OBS_PROPERTY_LIST') {
        property.values = Obs.nodeObs.OBS_content_getSourceFilterPropertiesSubParameters(
          sourceName, filterName, property.name
        ).map(
          ({ name, value }) => { return { [name]: value }; }
        );
      } else if (property.type === 'OBS_PROPERTY_BOOL') {
        property.currentValue = property.currentValue === 'true' ? 1 : 0;
      }
    }
    return properties;
  }

}
