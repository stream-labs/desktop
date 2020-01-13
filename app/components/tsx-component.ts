import Vue from 'vue';

export function createProps<TProps extends new () => any>(
  propsClass: TProps,
): Dictionary<{ default: any }> {
  const propsObj = {};
  const props = new propsClass();
  Object.keys(props).forEach((key: string) => {
    propsObj[key] = { default: props[key] };
  });
  return propsObj;
}

export default abstract class TsxComponent<
  TProps extends { value: unknown } | any = {}
> extends Vue {
  private vueTsxProps: Readonly<{
    slot?: string;
    ref?: string;
    class?: string;
    key?: string;
    style?: string | Dictionary<string>;
    vModel?: unknown;
    scopedSlots?: Dictionary<Function>;
  }> &
    Readonly<TProps>;

  value: TProps['value'];

  get props(): TProps {
    return this.$props as Readonly<TProps>;
  }
}
