import cloneDeep from 'lodash/cloneDeep';
import { Services } from 'components-react/service-provider';
import { ELayoutElement, ELayout, LayoutSlot } from 'services/layout';
import { useModule } from 'components-react/hooks/useModule';
import { mutation } from 'components-react/store';

class LayoutEditorModule {
  state = {
    currentLayout: this.layoutService.views.currentTab.currentLayout || ELayout.Default,
    slottedElements: cloneDeep(this.layoutService.views.currentTab.slottedElements) || {},
    browserUrl: '',
    showModal: false,
  };

  private get layoutService() {
    return Services.LayoutService;
  }

  get currentTab() {
    return this.layoutService.state.currentTab;
  }

  setCurrentTab(tab: string) {
    this.layoutService.actions.setCurrentTab(tab);
    this.setCurrentLayout(this.layoutService.state.tabs[tab].currentLayout);
    this.setSlottedElements(cloneDeep(this.layoutService.state.tabs[tab].slottedElements));
  }

  @mutation()
  setCurrentLayout(layout: ELayout) {
    this.state.currentLayout = layout;
  }

  @mutation()
  setBrowserUrl(url: string) {
    this.state.browserUrl = url;
  }

  @mutation()
  setSlottedElements(
    elements: { [Element in ELayoutElement]?: { slot: LayoutSlot; src?: string } },
  ) {
    this.state.slottedElements = elements;
  }

  @mutation()
  setShowModal(bool: boolean) {
    this.state.showModal = bool;
  }

  handleElementDrag(event: React.DragEvent<HTMLDivElement>, el: ELayoutElement) {
    const htmlElement = document.elementFromPoint(event.clientX, event.clientY);
    if (!el) return;
    if (!htmlElement) {
      this.setSlottedElements({ ...this.state.slottedElements, [el]: { slot: null } });
      return;
    }
    // In case the span tag is the element dropped on we check for parent element id
    const id = htmlElement.id || htmlElement?.parentElement?.id;
    let existingEl;
    if (id && ['1', '2', '3', '4', '5', '6'].includes(id)) {
      existingEl = Object.keys(this.state.slottedElements).find(
        existing => this.state.slottedElements[existing].slot === id,
      ) as ELayoutElement;
      if (existingEl && this.state.slottedElements[el]) {
        this.setSlottedElements({
          ...this.state.slottedElements,
          [existingEl]: this.state.slottedElements[el],
        });
      } else if (existingEl) {
        this.setSlottedElements({ ...this.state.slottedElements, [existingEl]: { slot: null } });
      }
      this.setSlottedElements({ ...this.state.slottedElements, [el]: { slot: id as LayoutSlot } });
    } else {
      this.setSlottedElements({ ...this.state.slottedElements, [el]: { slot: null } });
    }
  }
}

export function useLayoutEditor() {
  return useModule(LayoutEditorModule).select();
}
