import Vue from 'vue';

export function createProps<TProps extends new () => any>(propsClass: TProps): string[] {
  const props = new propsClass();
  return Object.keys(props);
}

export abstract class TsxComponent<TProps> extends Vue {
  private vueTsxProps: Readonly<{ slot?: string; ref?: string; class?: string; key?: string }> &
    Readonly<TProps>;

  get props(): TProps {
    return this.$props as Readonly<TProps>;
  }
}
