import Vue from 'vue';
import cx from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { LayoutService, ELayoutElement, ELayout, LayoutSlot } from 'services/layout';
import styles from './LayoutEditor.m.less';
import { $t } from 'services/i18n';
import { NavigationService } from 'services/navigation';
import { CustomizationService } from 'services/customization';

const TEMPLATE_MAP: Dictionary<string> = {
  [ELayout.Default]: 'default',
  [ELayout.TwoPane]: 'twoPane',
  [ELayout.Classic]: 'classic',
  [ELayout.OnePane]: 'onePane',
  [ELayout.FourByFour]: 'fourByFour',
  [ELayout.Triplets]: 'triplets',
};

@Component({})
export default class LayoutEditor extends TsxComponent {
  @Inject() private layoutService: LayoutService;
  @Inject() private navigationService: NavigationService;
  @Inject() private customizationService: CustomizationService;

  currentLayout = this.layoutService.state.currentLayout || ELayout.Default;

  slottedElements = cloneDeep(this.layoutService.state.slottedElements) || {};

  get elementTitles() {
    return {
      [ELayoutElement.Display]: $t('Stream Display'),
      [ELayoutElement.Minifeed]: $t('Mini Feed'),
      [ELayoutElement.Mixer]: $t('Audio Mixer'),
      [ELayoutElement.Scenes]: $t('Scene Selector'),
      [ELayoutElement.Sources]: $t('Source Selector'),
      [ELayoutElement.LegacyEvents]: $t('Legacy Events'),
    };
  }

  elementInSlot(slot: LayoutSlot) {
    return Object.keys(this.slottedElements).find(el => this.slottedElements[el] === slot);
  }

  classForSlot(slot: LayoutSlot) {
    const layout = TEMPLATE_MAP[this.currentLayout];
    return cx(styles.placementZone, styles[`${layout}${slot}`], {
      [styles.occupied]: this.elementInSlot(slot),
    });
  }

  layoutImage(layout: ELayout) {
    const mode = this.customizationService.isDarkTheme ? 'night' : 'day';
    const active = this.currentLayout === layout ? '-active' : '';
    return require(`../../../media/images/layouts/${mode}-${TEMPLATE_MAP[layout]}${active}.png`);
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
    if (this.currentLayout !== this.layoutService.state.currentLayout) {
      this.layoutService.changeLayout(this.currentLayout);
    }
    this.layoutService.setSlots(this.slottedElements);
    this.navigationService.navigate('Studio');
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
        <div>
          <div class={styles.title}>{$t('Elements')}</div>
          <div class={styles.subtitle}>{$t('Drag and drop to edit.')}</div>
          {Object.keys(ELayoutElement).map(element => (
            <div
              draggable
              class={styles.elementCell}
              onDragend={(e: MouseEvent) => this.handleElementDrag(e, ELayoutElement[element])}
            >
              <i class="fas fa-ellipsis-v" />
              {this.elementTitles[element]}
            </div>
          ))}
        </div>
      </div>
    );
  }

  render() {
    return (
      <div style={{ flexDirection: 'column' }}>
        <div class={styles.topBar}>
          <div>
            <div>{$t('Streamlabs OBS UI Customization')}</div>
            <div>{$t('Customize the appearance of your Streamlabs OBS Studio tab')}</div>
          </div>
          <button class="button button--action" onClick={() => this.save()}>
            {$t('Save Changes')}
          </button>
        </div>
        <div class={styles.editorContainer}>
          {this.sideBar}
          <div class={cx(styles.templateContainer, styles[TEMPLATE_MAP[this.currentLayout]])}>
            {['1', '2', '3', '4', '5', '6'].map((slot: LayoutSlot) => (
              <div
                class={this.classForSlot(slot)}
                id={slot}
                draggable={this.elementInSlot(slot)}
                onDragend={(e: MouseEvent) =>
                  this.handleElementDrag(e, ELayoutElement[this.elementInSlot(slot)])
                }
              >
                <span>{this.elementTitles[this.elementInSlot(slot)]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
