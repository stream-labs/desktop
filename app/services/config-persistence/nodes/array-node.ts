import { Node } from './node';

interface IArraySchema<TSchema> {
  items: TSchema[];
}

export abstract class ArrayNode<TSchema, TContext, TItem> extends Node<IArraySchema<TSchema>, TContext> {

  abstract saveItem(item: TItem, context: TContext): TSchema;

  abstract loadItem(item: TSchema, context: TContext): void;

  abstract getItems(context: TContext): TItem[];

  save(context: TContext) {
    this.data = {
      items: this.getItems(context).map(item => {
        return this.saveItem(item, context);
      })
    };
  }

  load(context: TContext) {
    this.data.items.forEach(item => {
      this.loadItem(item, context);
    });
  }

}
