// All config nodes should inherit from this class

interface SchemaAnnotation {
  schemaVersion: number;
  nodeType: string;
}

export abstract class Node<TSchema, TContext> {

  abstract schemaVersion: number;


  /**
   * The save method is responsible for taking the current
   * application state and saving it into the data property.
   * It is also responsible for calling save on all child
   * nodes in the desired save order.
   */
  abstract save(context: TContext): Promise<void>;


  /**
   * The load method is responsible for taking the data saved
   * in the data propertly and loading it into the application
   * state.  It is also responsible for calling load on all child
   * nodes in the desired load order.
   */
  abstract load(context: TContext): Promise<void>;


  /**
   * Nodes that have evolved from schema version 1 should
   * override this method.  This function is responsible
   * for changing this.data to match the current schema.
   * @param version The old version number
   */
  migrate(version: number) {
    // By default, do nothing.
  }


  data: TSchema;


  toJSON(): SchemaAnnotation & TSchema {
    return Object.assign({
      schemaVersion: this.schemaVersion,
      nodeType: this.constructor.name
    }, this.data);
  }


  fromJSON(obj: SchemaAnnotation & TSchema) {
    // TODO: Handle schema version migration here

    const clone = Object.assign({}, obj);
    const version = clone.schemaVersion;

    delete clone.schemaVersion;
    delete clone.nodeType;

    this.data = clone;

    this.migrate(version);
  }

}
