import { Component } from 'vue-property-decorator';
import TsxComponent from 'components/tsx-component';
import { Main as MainWindow } from 'components/shared/ReactComponentList';

@Component({})
export default class Main extends TsxComponent<{}> {
  // TODO: Not sure how to access Vue $store directly in React so using a wrapper component for now
  render() {
    return (
      <MainWindow
        componentProps={{
          bulkLoadFinished: this.$store.state.bulkLoadFinished,
          i18nReady: this.$store.state.i18nReady,
        }}
      />
    );
  }
}
