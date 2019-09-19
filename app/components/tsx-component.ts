import Vue from 'vue';

export default abstract class TsxComponent<TProps> extends Vue {
  private vueTsxProps: Readonly<{ slot?: string; ref?: string; class?: string; key?: string }> &
    Readonly<TProps>;
}
