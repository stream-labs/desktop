import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import ListInput from 'components/shared/forms/ListInput.vue';
import { ISourceApi } from 'services/sources';
import { IListInput } from 'components/shared/forms/Input';
import { WidgetDefinitions, IWidget } from 'services/widgets';

@Component({
  components: {
    ListInput
  }
})
export default class WidgetProperties extends Vue {

  @Prop() source: ISourceApi;

  widgetModel: IListInput<string> = null;

  created() {
    this.refreshWidgetModel();
  }

  handleInput(value: IListInput<string>) {
    this.source.setPropertiesManagerSettings({
      widgetType: value.value
    });
    this.refreshWidgetModel();
    this.$emit('update');
  }

  refreshWidgetModel() {
    const value = this.source.getPropertiesManagerSettings().widgetType.toString();

    this.widgetModel = {
      value,
      description: 'Widget Type',
      name: 'widgetType',
      options: Object.keys(WidgetDefinitions).map(type => {
        const widget = WidgetDefinitions[type] as IWidget;

        return {
          description: widget.name,
          value: type
        };
      })
    };
  }

}
