import { Node } from './node';
import { compact } from 'lodash';

interface IArraySchema<TSchema> {
  items: TSchema[];
}

export abstract class ArrayNode<TSchema, TContext, TItem> extends Node<IArraySchema<TSchema>, TContext> {

  abstract saveItem(item: TItem, context: TContext): Promise<TSchema>;

  abstract loadItem(item: TSchema, context: TContext): Promise<(() => Promise<void>) | void>;

  abstract getItems(context: TContext): TItem[];

  async save(context: TContext): Promise<void> {
    const values = await Promise.all(this.getItems(context).map(item => {
      return this.saveItem(item, context);
    }));

    this.data = { items: compact(values) };
  }

  async load(context: TContext): Promise<void> {
    const afterLoadItemsCallbacks = await Promise.all(this.data.items.map(item => {
      return this.loadItem(item, context);
    }));

    await Promise.all(afterLoadItemsCallbacks.map(callback => callback && callback()));
  }

}
