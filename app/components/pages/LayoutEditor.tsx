import electron from 'electron';
import cx from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import TsxComponent from 'components/tsx-component';
import { Component } from 'vue-property-decorator';
import { Inject } from 'services/core/injector';
import { LayoutService, ELayoutElement, ELayout } from 'services/layout';
import styles from './LayoutEditor.m.less';
import { $t } from 'services/i18n';
import { NavigationService } from 'services/navigation';

const TEMPLATE_MAP: Dictionary<string> = {
  [ELayout.Default]: 'default',
  [ELayout.TwoPane]: 'twoPane',
};

@Component({})
export default class LayoutEditor extends TsxComponent {
  @Inject() private layoutService: LayoutService;
  @Inject() private navigationService: NavigationService;

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

  elementInSlot(slot: '1' | '2' | '3' | '4' | '5' | '6') {
    const element = Object.keys(this.slottedElements).find(el => this.slottedElements[el] === slot);
    return this.elementTitles[element];
  }

  classForSlot(slot: '1' | '2' | '3' | '4' | '5' | '6') {
    const layout = TEMPLATE_MAP[this.currentLayout];
    return cx(styles.placementZone, styles[`${layout}${slot}`], {
      [styles.occupied]: this.elementInSlot(slot),
    });
  }

  slotElement(el: ELayoutElement, slot: '1' | '2' | '3' | '4' | '5' | '6') {
    const existingElement = Object.keys(this.slottedElements).find(
      existing => this.slottedElements[existing] === slot,
    );
    if (existingElement) this.slottedElements[existingElement] = undefined;
    this.slottedElements[el] = slot;
  }

  handleElementDrag(event: MouseEvent, el: ELayoutElement) {
    const htmlElement = document.elementFromPoint(event.clientX, event.clientY);
    this.slotElement(el, htmlElement.id as '1' | '2' | '3' | '4' | '5' | '6');
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
          {Object.keys(ELayout).map(layout => (
            <div onClick={() => this.setLayout(ELayout[layout])}>{TEMPLATE_MAP[layout]}</div>
          ))}
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
            {['1', '2', '3', '4', '5', '6'].map((slot: '1' | '2' | '3' | '4' | '5' | '6') => (
              <div class={this.classForSlot(slot)} id={slot}>
                <span>{this.elementInSlot(slot)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
