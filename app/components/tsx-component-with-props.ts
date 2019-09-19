import Vue from 'vue';

export function createProps<TProps extends new () => any>(propsClass: TProps): string[] {
  const props = new propsClass();
  console.log('register props', Object.keys(props));
  return Object.keys(props);
}

export abstract class TsxComponent<TProps> extends Vue {
  protected vueTsxProps: Readonly<{ slot?: string; ref?: string; class?: string; key?: string }> &
    Readonly<TProps>;

  get props(): TProps {
    return this.$props as TProps;
  }
}
