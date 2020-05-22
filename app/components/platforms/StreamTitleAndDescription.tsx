import { Component, Watch } from 'vue-property-decorator';
import { $t } from 'services/i18n';
import TsxComponent from 'components/tsx-component';
import HFormGroup from 'components/shared/inputs/HFormGroup.vue';
import { metadata } from 'components/shared/inputs';
import { createProps } from '../tsx-component';
import { BoolInput } from '../shared/inputs/inputs';
import cloneDeep from 'lodash/cloneDeep';
import styles from './StreamTitleAndDescription.m.less';

class ComponentProps {
  allowCustom?: boolean = false;
  value?: IComponentValue = {
    title: '',
    description: '',
    customEnabled: false,
  };
}

interface IComponentValue {
  title: string;
  description: string;
  customEnabled?: boolean;
}

@Component({ props: createProps(ComponentProps) })
export default class StreamTitleAndDescription extends TsxComponent<ComponentProps> {
  private localValue: IComponentValue = null;

  created() {
    this.localValue = cloneDeep(this.props.value);
  }

  @Watch('localValue', { deep: true })
  private onValueChangeHandler() {
    this.$emit('input', this.localValue);
  }

  render() {
    const fieldsAreVisible =
      !this.props.allowCustom || (this.props.allowCustom && this.props.value.customEnabled);

    return (
      <div>
        {this.props.allowCustom && (
          <HFormGroup>
            <BoolInput
              vModel={this.value.customEnabled}
              title={$t('Use custom title and description')}
            />
          </HFormGroup>
        )}

        <transition name="slidedown">
          {fieldsAreVisible && (
            <div>
              <HFormGroup
                vModel={this.localValue.title}
                metadata={metadata.text({ title: $t('Title'), fullWidth: true })}
              />
              <HFormGroup
                vModel={this.localValue.description}
                metadata={metadata.textArea({
                  title: $t('Description'),
                  fullWidth: true,
                })}
              />
            </div>
          )}
        </transition>
      </div>
    );
  }
}
