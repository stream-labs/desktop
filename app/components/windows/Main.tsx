import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import cx from 'classnames';
import TsxComponent from 'components/tsx-component';
import { Main, Loader } from 'components/shared/ReactComponentList';
import { Inject } from 'services';
import { CustomizationService } from 'app-services';
import antdThemes from 'styles/antd/index';
import styles from 'components-react/windows/Main.m.less';

@Component({})
export default class MainWindow extends TsxComponent {
  @Inject() customizationService: CustomizationService;

  get uiReady() {
    return this.$store.state.bulkLoadFinished && this.$store.state.i18nReady;
  }

  get theme() {
    return this.customizationService.views.currentTheme;
  }

  mounted() {
    antdThemes[this.theme].use();
  }

  render() {
    return (
      <div style={{ height: '100%' }} className={this.theme}>
        {this.uiReady && <Main />}
        <transition name="loader">
          {!this.uiReady && (
            <div className={cx(styles.mainLoading, { [styles.initialLoading]: !this.uiReady })}>
              <Loader />
            </div>
          )}
        </transition>
      </div>
    );
  }
}
