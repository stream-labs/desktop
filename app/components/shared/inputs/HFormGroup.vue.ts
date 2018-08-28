import { Component, Prop } from 'vue-property-decorator';
import uuid from 'uuid';
import Vue from 'vue';
import { ErrorField } from 'vee-validate';
import { EInputType, IInputMetadata } from './index';
import { BaseInput } from './BaseInput';
import FormInput from './FormInput.vue';
import ValidatedForm from 'components/shared/inputs/ValidatedForm.vue';


@Component({
  components: { FormInput }
})
export default class HFormGroup extends BaseInput<any, IInputMetadata> {

  @Prop()
  readonly type: EInputType;

  @Prop()
  readonly value: undefined;

  @Prop()
  readonly metadata: IInputMetadata;

  @Prop()
  readonly title: string;

  /**
   * uuid serves to link input field and validator message
   */
  readonly uuid = (this.metadata && this.metadata.uuid) || uuid();

  inputErrors: ErrorField[] = [];

  /**
   * contains ValidatedForm wrapper if exist
   */
  private form: ValidatedForm = (() => {
    let comp: Vue = this;
    do {
      comp = comp.$parent;
    } while (comp && !(comp instanceof ValidatedForm));
    return comp as ValidatedForm;
  })();

  created() {
    if (!this.form) return;
    this.form.validated.subscribe(errors => {
      this.inputErrors = errors.filter(error => error.field == this.uuid);
    });
  }

  get formInputMetadata() {
    const options = this.options;
    if (!options.type) return {};
    const inputMetadata = options;

    // FormGroup handle the render of the FormInput title
    // so remove the title from FormInput metadata
    delete inputMetadata.title;
    delete inputMetadata.tooltip;
    delete inputMetadata.description;
    return inputMetadata;
  }

  getOptions() {
    const options = super.getOptions();
    options.uuid = this.uuid;
    options.type = this.type || options.type;
    options.title = this.title || options.title;
    return options;
  }
}
