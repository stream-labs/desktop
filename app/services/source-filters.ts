import { StatefulService } from './stateful-service';
import { obsValuesToInputValues, inputValuesToObsValues, TFormData } from '../components/shared/forms/Input';

import Obs from '../api/Obs';

const nodeObs = Obs.nodeObs as Dictionary<Function>;

export interface ISourceFilter {
  name: string;
  visible: boolean;
}

interface ISourceFiltersState {
  availableTypes: { type: string, description: string }[];
}

export default class SourceFiltersService extends StatefulService<ISourceFiltersState> {


  static initialState: ISourceFiltersState = {
    availableTypes: nodeObs.OBS_content_getListFilters()
  };


  add(sourceName: string, filterType: string, filterName: string) {
    nodeObs.OBS_content_addSourceFilter(sourceName, filterType, filterName);
  }


  remove(sourceName: string, filterName: string) {
    nodeObs.OBS_content_removeSourceFilter(sourceName, filterName);
  }


  setProperties(sourceName: string, filterName: string, properties: TFormData) {
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


  getFilters(sourceName: string): ISourceFilter[] {
    const filtersNames: string[] = nodeObs.OBS_content_getListSourceFilters(sourceName);
    return filtersNames.map(filterName => {
      return {
        name: filterName,
        visible: nodeObs.OBS_content_getSourceFilterVisibility(sourceName, filterName, name) as boolean
      };
    });
  }


  setVisibility(sourceName: string, filterName: string, visible: boolean) {
    nodeObs.OBS_content_setSourceFilterVisibility(sourceName, filterName, visible);
  }


  getAddNewFormData() {
    return {
      type: {
        description: 'Filter type',
        name: 'type',
        value: this.state.availableTypes[0].type,
        options: this.state.availableTypes.map((item: { type: string, description: string }) => {
          return { description: item.description, value: item.type };
        })
      },
      name: {
        description: 'Filter name',
        name: 'name',
        value: 'New filter'
      }
    };
  }


  getPropertiesFormData(sourceName: string, filterName: string) {
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
