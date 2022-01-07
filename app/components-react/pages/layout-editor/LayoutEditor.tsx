import React, { useEffect, useState } from 'react';
import cx from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import styles from './LayoutEditor.m.less';
import { ELayoutElement, ELayout, LayoutSlot } from 'services/layout';
import { $t } from 'services/i18n';
import Scrollable from 'components-react/shared/Scrollable';
import { Services } from 'components-react/service-provider';
import { useVuex } from 'components-react/hooks';
import { useLayoutEditor } from './hooks';
import TopBar from './TopBar';

export default function LayoutEditor() {
  const { LayoutService, CustomizationService } = Services;

  const {
    slottedElements,
    setSlottedElements,
    setBrowserUrl,
    currentLayout,
    setCurrentLayout,
    showModal,
    setShowModal,
  } = useLayoutEditor();

  const { currentTab } = useVuex(() => ({
    currentTab: LayoutService.state.currentTab,
  }));

  useEffect(() => {
    if (slottedElements[ELayoutElement.Browser]) {
      setBrowserUrl(slottedElements[ELayoutElement.Browser]?.src || '');
    }
  }, []);

  useEffect(() => {
    setCurrentLayout(LayoutService.views.currentTab.currentLayout);
    setSlottedElements(cloneDeep(LayoutService.views.currentTab.slottedElements));
  }, [currentTab]);

  return (
    <div style={{ flexDirection: 'column' }}>
      <TopBar />
      <div className={styles.editorContainer}>
        <SideBar />
        <div
          className={cx(
            styles.templateContainer,
            styles[LayoutService.views.className(currentLayout)],
          )}
        >
          <DisplayedLayout />
        </div>
      </div>
      {showModal && (
        <div className={styles.modalBackdrop}>
          <AddTabModal onClose={() => setShowModal(false)} />
        </div>
      )}
    </div>
  );
}

function SideBar() {
  const { LayoutService, CustomizationService } = Services;
  const { currentLayout, setCurrentLayout } = useLayoutEditor();

  function layoutImage(layout: ELayout) {
    const mode = CustomizationService.isDarkTheme ? 'night' : 'day';
    const active = currentLayout === layout ? '-active' : '';
    const className = LayoutService.views.className(layout);
    return require(`../../../media/images/layouts/${mode}-${className}${active}.png`);
  }

  return (
    <div className={styles.sideBar}>
      <div>
        <div className={styles.title}>{$t('Layouts')}</div>
        <div className={styles.subtitle} />
        <Scrollable className={styles.layouts} autoSizeCapable={true}>
          {Object.keys(ELayout).map(layout => (
            <img
              className={currentLayout === layout ? styles.active : ''}
              onClick={() => setCurrentLayout(ELayout[layout])}
              src={layoutImage(ELayout[layout])}
            />
          ))}
        </Scrollable>
      </div>
      <ElementList />
    </div>
  );
}

function ElementList() {
  const { LayoutService } = Services;
  const { slottedElements, setSlottedElements, handleElementDrag } = useLayoutEditor();

  return (
    <div className={styles.elementList}>
      <div className={styles.title}>{$t('Elements')}</div>
      <div className={styles.subtitle}>{$t('Drag and drop to edit.')}</div>
      <Scrollable className={styles.elementContainer}>
        {Object.keys(ELayoutElement).map((element: ELayoutElement) => (
          <div
            draggable
            className={styles.elementCell}
            onDragEnd={(e: DragEvent<HTMLDivElement>) =>
              handleElementDrag(e, ELayoutElement[element])
            }
          >
            <i className="fas fa-ellipsis-v" />
            {LayoutService.views.elementTitle(element)}
          </div>
        ))}
      </Scrollable>
    </div>
  );
}

function DisplayedLayout() {
  const { LayoutService } = Services;
  const { slottedElements, currentLayout, browserUrl, handleElementDrag } = useLayoutEditor();

  const [canDragSlot, setCanDragSlot] = useState(true);
  const [highlightedSlot, setHighlightedSlot] = useState<LayoutSlot | null>(null);

  function elementInSlot(slot: LayoutSlot) {
    return Object.keys(slottedElements).find(
      el => slottedElements[el].slot === slot,
    ) as ELayoutElement;
  }

  function classForSlot(slot: LayoutSlot) {
    const layout = LayoutService.views.className(currentLayout);
    return cx(styles.placementZone, styles[`${layout}${slot}`], {
      [styles.occupied]: elementInSlot(slot),
      [styles.highlight]: highlightedSlot === slot,
    });
  }

  return (
    <>
      {['1', '2', '3', '4', '5', '6'].map((slot: LayoutSlot) => (
        <div
          className={classForSlot(slot)}
          id={slot}
          draggable={elementInSlot(slot) && canDragSlot}
          onDragEnter={(): unknown => setHighlightedSlot(slot)}
          onDragExit={(): unknown => setHighlightedSlot(null)}
          onDragEnd={(e: MouseEvent) => handleElementDrag(e, ELayoutElement[elementInSlot(slot)])}
        >
          <span>{LayoutService.views.elementTitle(elementInSlot(slot))}</span>
          {elementInSlot(slot) === ELayoutElement.Browser && (
            <TextInput
              class={styles.urlTextBox}
              vModel={browserUrl}
              onFocus={() => setCanDragSlot(false)}
              onBlur={() => setCanDragSlot(true)}
              metadata={{ placeholder: $t('Enter Target URL') }}
            />
          )}
        </div>
      ))}
    </>
  );
}
