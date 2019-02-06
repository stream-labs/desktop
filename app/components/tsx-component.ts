import Vue from 'vue';

export default abstract class TsxComponent<T> extends Vue {
  private vueTsxProps: Readonly<{}> & Readonly<T>;
}
