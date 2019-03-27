import Vue from 'vue';

export default abstract class TsxComponent<T> extends Vue {
  private vueTsxProps: Readonly<{ slot?: string }> & Readonly<T>;
}
