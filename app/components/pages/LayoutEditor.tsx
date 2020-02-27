import Vue from 'vue';
import cx from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import TsxComponent from 'components/tsx-component';
import { Component, Watch } from 'vue-property-decorator';
import styles from './LayoutEditor.m.less';
import AddTabModal from './AddTabModal';
import { ListInput } from 'components/shared/inputs/inputs';
import { Inject } from 'services/core/injector';
import { LayoutService, ELayoutElement, ELayout, LayoutSlot } from 'services/layout';
import { $t } from 'services/i18n';
import { NavigationService } from 'services/navigation';
import { CustomizationService } from 'services/customization';

@Component({})
export default class LayoutEditor extends TsxComponent {
  @Inject() private layoutService: LayoutService;
  @Inject() private navigationService: NavigationService;
  @Inject() private customizationService: CustomizationService;

  currentLayout = this.layoutService.views.currentTab.currentLayout || ELayout.Default;

  slottedElements = cloneDeep(this.layoutService.views.currentTab.slottedElements) || {};

  tabOptions = Object.keys(this.layoutService.state.tabs).map(tab => ({
    value: tab,
    title: this.layoutService.state.tabs[tab].name,
  }));

  private highlightedSlot: LayoutSlot = null;
  private showModal = false;

  elementInSlot(slot: LayoutSlot) {
    return Object.keys(this.slottedElements).find(
      el => this.slottedElements[el] === slot,
    ) as ELayoutElement;
  }

  classForSlot(slot: LayoutSlot) {
    const layout = this.layoutService.views.className(this.currentLayout);
    return cx(styles.placementZone, styles[`${layout}${slot}`], {
      [styles.occupied]: this.elementInSlot(slot),
      [styles.highlight]: this.highlightedSlot === slot,
    });
  }

  layoutImage(layout: ELayout) {
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const active = this.currentLayout === layout ? '-active' : '';
    const className = this.layoutService.views.className(layout);
    return require(`../../../media/images/layouts/${mode}-${className}${active}.png`);
  }

  handleElementDrag(event: MouseEvent, el: ELayoutElement) {
    const htmlElement = document.elementFromPoint(event.clientX, event.clientY);
    if (!el) return;
    if (!htmlElement) {
      this.slottedElements[el] = undefined;
      return;
    }
    // In case the span tag is the element dropped on we check for parent element id
    const id = htmlElement.id || htmlElement.parentElement.id;
    let existingEl;
    if (['1', '2', '3', '4', '5', '6'].includes(id)) {
      existingEl = Object.keys(this.slottedElements).find(
        existing => this.slottedElements[existing] === id,
      ) as ELayoutElement;
      if (existingEl && this.slottedElements[el]) {
        Vue.set(this.slottedElements, existingEl, this.slottedElements[el]);
      } else if (existingEl) {
        Vue.set(this.slottedElements, existingEl, null);
      }
      Vue.set(this.slottedElements, el, id as LayoutSlot);
    } else {
      Vue.set(this.slottedElements, el, null);
    }
  }

  setLayout(layout: ELayout) {
    this.currentLayout = layout;
  }

  save() {
    if (this.currentLayout !== this.layoutService.views.currentTab.currentLayout) {
      this.layoutService.changeLayout(this.currentLayout);
    }
    this.layoutService.setSlots(this.slottedElements);
    this.navigationService.navigate('Studio');
  }

  closeModal() {
    this.showModal = false;
  }

  openModal() {
    this.showModal = true;
  }

  get numberOfTabs() {
    return Object.keys(this.layoutService.state.tabs).length;
  }

  @Watch('numberOfTabs')
  updateTabs() {
    this.tabOptions = Object.keys(this.layoutService.state.tabs).map(tab => ({
      value: tab,
      title: this.layoutService.state.tabs[tab].name,
    }));
  }

  get currentTab() {
    return this.layoutService.views.currentTab;
  }

  @Watch('currentTab')
  updateUI() {
    this.currentLayout = this.layoutService.views.currentTab.currentLayout;
    this.slottedElements = cloneDeep(this.layoutService.views.currentTab.slottedElements);
  }

  setTab(tab: string) {
    this.layoutService.setCurrentTab(tab);
  }

  removeCurrentTab() {
    this.layoutService.removeCurrentTab();
  }

  get sideBar() {
    return (
      <div class={styles.sideBar}>
        <div>
          <div class={styles.title}>{$t('Layouts')}</div>
          <div class={styles.subtitle} />
          <div class={styles.layouts}>
            {Object.keys(ELayout).map(layout => (
              <img
                class={this.currentLayout === layout ? styles.active : ''}
                onClick={() => this.setLayout(ELayout[layout])}
                src={this.layoutImage(ELayout[layout])}
              />
            ))}
          </div>
        </div>
        <div style="display: flex; flex-direction: column;">
          <div class={styles.title}>{$t('Elements')}</div>
          <div class={styles.subtitle}>{$t('Drag and drop to edit.')}</div>
          <div class={styles.elementContainer}>
            {Object.keys(ELayoutElement).map((element: ELayoutElement) => (
              <div
                draggable
                class={styles.elementCell}
                onDragend={(e: MouseEvent) => this.handleElementDrag(e, ELayoutElement[element])}
              >
                <i class="fas fa-ellipsis-v" />
                {this.layoutService.views.elementTitle(element)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  get modal() {
    return (
      <div class={styles.modalBackdrop}>
        <AddTabModal onClose={() => this.closeModal()} />
      </div>
    );
  }

  render() {
    return (
      <div style={{ flexDirection: 'column' }}>
        <div class={styles.topBar}>
          <ListInput
            style="z-index: 1;"
            value={this.layoutService.state.currentTab}
            onInput={(tab: string) => this.setTab(tab)}
            metadata={{ options: this.tabOptions }}
            v-tooltip={{ content: $t('Current Tab'), placement: 'bottom' }}
          />
          <button
            class={cx('button button--default', styles.addButton)}
            v-tooltip={{ content: $t('Add Tab'), placement: 'bottom' }}
            onClick={() => this.openModal()}
          >
            <i class="icon-add" />
          </button>
          {this.layoutService.state.currentTab !== 'default' && (
            <button
              class={cx('button button--warn', styles.removeButton)}
              v-tooltip={{ content: $t('Delete Current Tab'), placement: 'bottom' }}
              onClick={() => this.removeCurrentTab()}
            >
              <i class="icon-trash" />
            </button>
          )}
          <button class="button button--action" onClick={() => this.save()}>
            {$t('Save Changes')}
          </button>
        </div>
        <div class={styles.editorContainer}>
          {this.sideBar}
          <div
            class={cx(
              styles.templateContainer,
              styles[this.layoutService.views.className(this.currentLayout)],
            )}
          >
            {['1', '2', '3', '4', '5', '6'].map((slot: LayoutSlot) => (
              <div
                class={this.classForSlot(slot)}
                id={slot}
                draggable={this.elementInSlot(slot)}
                ondragenter={(): unknown => (this.highlightedSlot = slot)}
                ondragexit={(): unknown => (this.highlightedSlot = null)}
                onDragend={(e: MouseEvent) =>
                  this.handleElementDrag(e, ELayoutElement[this.elementInSlot(slot)])
                }
              >
                <span>{this.layoutService.views.elementTitle(this.elementInSlot(slot))}</span>
              </div>
            ))}
          </div>
        </div>
        {this.showModal && this.modal}
      </div>
    );
  }
}
