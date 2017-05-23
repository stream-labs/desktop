import { StatefulService } from './stateful-service';
import { obsValuesToInputValues, inputValuesToObsValues } from '../components/shared/forms/Input.ts';

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
    const propertiesToSave = inputValuesToObsValues(properties, {
      boolToString: true,
      intToString: true,
      valueToCurrentValue: true,
      valueToObject: true
    });

    for (const prop of propertiesToSave) {
      nodeObs.OBS_content_setSourceFilterProperty(
        sourceName,
        filterName,
        prop.name,
        prop.value
      );
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
        value: this.state.availableTypes[0].type,
        options: this.state.availableTypes.map(({ type, description }) => {
          return { description, value: type };
        })
      },
      name: {
        description: 'Filter name',
        name: 'name',
        value: 'New filter'
      }
    };
  }


  getPropertiesFormData(sourceName, filterName) {
    let properties = nodeObs.OBS_content_getSourceFilterProperties(sourceName, filterName);
    if (!properties) return [];

    properties = obsValuesToInputValues(properties, {
      valueIsObject: true,
      boolIsString: true,
      valueGetter: propName => {
        return nodeObs.OBS_content_getSourceFilterPropertyCurrentValue(
          sourceName, filterName, propName
        );
      },
      subParametersGetter: propName => {
        return nodeObs.OBS_content_getSourceFilterPropertiesSubParameters(
          sourceName, filterName, propName
        );
      }
    });

    return properties;
  }

}
