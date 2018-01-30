import { Node } from './node';
import { compact } from 'lodash';

interface IArraySchema<TSchema> {
  items: TSchema[];
}

export abstract class ArrayNode<TSchema, TContext, TItem> extends Node<IArraySchema<TSchema>, TContext> {

  abstract saveItem(item: TItem, context: TContext): Promise<TSchema>;

  abstract loadItem(item: TSchema, context: TContext): Promise<(() => Promise<void>) | void>;

  abstract getItems(context: TContext): TItem[];

  save(context: TContext): Promise<void> {
    return new Promise(resolve => {
      Promise.all(this.getItems(context).map(item => {
        return this.saveItem(item, context);
      })).then(values => {
        this.data = { items: compact(values) };
        resolve();
      });
    });
  }

  load(context: TContext): Promise<void> {
    return new Promise(resolve => {
      Promise.all(this.data.items.map(item => {
        return this.loadItem(item, context);
      })).then((afterLoadItemsCallbacks) => {
        Promise.all(afterLoadItemsCallbacks.map(callback => callback && callback()))
          .then(() => resolve());
      });
    });
  }

}
