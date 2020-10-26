import { Component, Prop } from 'vue-property-decorator';
import { Multiselect } from 'vue-multiselect';
import { IListMetadata, IListOption } from './index';
import { BaseInput } from './BaseInput';
import { Spinner } from 'streamlabs-beaker';

@Component({
  components: { Multiselect, Spinner },
})
export default class ListInput extends BaseInput<
  string,
  IListMetadata<string>,
  {
    handleSearchChange?: (val: string) => unknown;
    handleOpen?: () => unknown;
    showImagePlaceholder?: boolean;
    imageSize?: { width: number; height: number };
  }
> {
  @Prop() readonly value: string;
  @Prop() readonly metadata: IListMetadata<string>;
  @Prop() readonly title: string;
  @Prop() readonly handleSearchChange?: (val: string) => unknown;
  @Prop() readonly handleOpen?: () => unknown;
  @Prop() readonly showImagePlaceholder: boolean;
  @Prop() readonly imageSize: { width: number; height: number };

  get placeholder() {
    return this.options.placeholder || 'Select Option';
  }

  onInputHandler(option: IListOption<string>) {
    if (option) {
      this.emitInput(option.value);
    } else if (this.options.allowEmpty) {
      this.emitInput(null);
    } else {
      this.emitInput(this.value);
    }
  }

  getOptions(): IListMetadata<string> {
    const options = super.getOptions();
    return {
      ...options,
      // internalSearch is `true` by default in vue-multiselect
      internalSearch: options.internalSearch == null ? true : options.internalSearch,
      allowEmpty: !!options.allowEmpty, // undefined value is not working for vue-multiselect
    };
  }

  getImage(option: { data?: { image?: string } }) {
    return option.data?.image || '';
  }

  get iconSizeStyle() {
    const { width, height } = this.props.imageSize
      ? this.props.imageSize
      : { width: 15, height: 15 };
    return {
      width: `${width}px`,
      height: `${height}px`,
    };
  }

  get currentMultiselectValue() {
    const options = this.options.options;
    let option = options.find((opt: IListOption<string>) => this.value === opt.value);

    if (this.value && this.options.allowCustom) {
      option = { value: this.value, title: this.value } as IListOption<string>;
      this.options.options.push(option);
    }

    if (option) return option;
    if (this.getOptions().allowEmpty) return null;
    return options[0];
  }

  get selectedOption(): IListOption<string, unknown> {
    return this.options.options.find(option => option.value === this.value);
  }

  private onSearchChangeHandler(value: string) {
    this.$emit('search-change', value);
    this.$props.handleSearchChange && this.$props.handleSearchChange(value);
  }
}
