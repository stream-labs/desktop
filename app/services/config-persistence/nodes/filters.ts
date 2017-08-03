import { ArrayNode } from './array-node';
import { ObsFilter } from '../../obs-api';
import { Source } from '../../sources';

interface ISchema {
  type: string;
  name: string;
  settings: object;
}

interface IContext {
  source: Source;
}


// TODO: This class should not use the OBS API directly.  Instead,
// it should interact with the filters service.  This should be
// changed when filters are moved over to the new OBS bindings.
export class FiltersNode extends ArrayNode<ISchema, IContext, ObsFilter> {

  schemaVersion = 1;


  getItems(context: IContext) {
    return context.source.getObsInput().filters;
  }


  saveItem(filter: ObsFilter) {
    return {
      type: filter.id,
      name: filter.name,
      settings: filter.settings
    };
  }


  loadItem(obj: ISchema, context: IContext) {
    const filter = ObsFilter.create(obj.type, obj.name, obj.settings);
    context.source.getObsInput().addFilter(filter);
  }

}
