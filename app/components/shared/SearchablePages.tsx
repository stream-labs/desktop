import TsxComponent from 'components/tsx-component';
import { Component, Prop, Watch } from 'vue-property-decorator';
import Mark from 'mark.js';
import styles from './SearchablePages.m.less';

import { Spinner } from 'streamlabs-beaker';

interface IPageInfo {
  /**
   * text fetched from the page via .innerText attribute
   */
  text: string;
  /**
   * text fetched from page inputs
   */
  inputs: string[];
}

/**
 * A component for the client-side text search
 */
@Component({
  components: { Spinner },
})
export default class SearchablePages extends TsxComponent<{
  page: string;
  pages: string[];
}> {
  @Prop() page: string;
  @Prop() pages: string[];
  @Prop() searchStr: string;

  /**
   * this event is called when page has been switched but before it has been rendered
   * can be used for preparing data for rendering
   */
  @Prop() onBeforePageScan?: (page: string) => any;

  /**
   * this event is called when page has been rendered but before it has been parsed
   * if returns a promise, scanning won't start unless it will be resolved
   */
  @Prop() onPageRender?: (page: string) => Promise<any> | any;

  currentPage: string = this.page || '';
  pagesInfo: Dictionary<IPageInfo> = null;
  searchResultPages: string[];
  loading: boolean = false;

  $refs: {
    pageSlot: HTMLDivElement;
  };

  @Watch('searchStr')
  private async onSearchHandler(searchStr: string) {
    if (this.loading) return;

    // build the pages cache if it's empty
    if (!this.pagesInfo) await this.scanPages();

    // find pages matches to the search string in the cache
    const searchResultPages: string[] = [];
    Object.keys(this.pagesInfo).forEach(pageName => {
      const pageInfo = this.pagesInfo[pageName];
      const pageText = pageInfo.text + pageInfo.inputs.join(' ');
      if (pageText.match(new RegExp(searchStr, 'i'))) searchResultPages.push(pageName);
    });
    this.searchResultPages = searchResultPages;

    this.$emit('searchCompleted', this.searchResultPages);

    // after we sent `searchCompleted` event to the external component, it may re-render the slot content
    // so call `$nextTick` before `highlightPage()` to highlight the relevant content
    await this.$nextTick();
    await this.highlightPage(this.searchStr);

    // if search request has been updated while searching then search again
    if (searchStr !== this.searchStr) await this.onSearchHandler(this.searchStr);
  }

  @Watch('page')
  private async onPageChangeHandler(page: string) {
    this.currentPage = page;

    // if search is active then highlight the current page
    if (this.searchStr && this.pagesInfo) {
      await this.$nextTick();
      await (this.onPageRender && this.onPageRender(page));
      await this.highlightPage(this.searchStr);
    }
  }

  /**
   * fetch and cache all text information from the page
   */
  private async scanPages() {
    this.loading = true;
    this.pagesInfo = {};

    // switch and render each page
    for (const page of this.pages) {
      this.onBeforePageScan && this.onBeforePageScan(page);
      // render the page
      this.currentPage = page;
      await this.$nextTick();

      await (this.onPageRender && this.onPageRender(page));

      // collect the page text and text from inputs
      this.pagesInfo[page] = {
        text: this.$refs.pageSlot.innerText,
        inputs: this.getPageInputs().map($input => {
          // collect the text from text-inputs
          const inputsText = Array.from($input.querySelectorAll('[type="text"]'))
            .map(($textInput: HTMLInputElement) => $textInput.value)
            .join(' ');

          // collect the text from list-options
          const listOptionsText = Array.from($input.querySelectorAll('[data-option-value]'))
            .map(($option: HTMLSpanElement) => $option.innerText)
            .join(' ');

          return `${inputsText} ${$input.innerText} ${listOptionsText}`;
        }),
      };
    }

    // don't forget to switch back to the original page from the `page` property
    this.currentPage = this.page;
    await this.$nextTick();

    this.loading = false;
    this.$emit('scanCompleted');
  }

  /**
   * this method highlights search matches by modifying DOM elements inside `pageSlot`
   * this is not a recommended way to interact with elements in Vue.js
   * so it should be used carefully
   */
  async highlightPage(searchStr: string) {
    // highlight the page text via Mark.js
    const mark = new Mark(this.$refs.pageSlot);
    mark.unmark();
    if (searchStr) mark.mark(searchStr);

    // highlight inputs
    const pageInfo = this.pagesInfo[this.page];
    this.getPageInputs().forEach(($input, ind) => {
      $input.classList.remove('search-highlight');
      const needHighlight = searchStr && pageInfo.inputs[ind].match(new RegExp(searchStr, 'i'));
      if (needHighlight) $input.classList.add('search-highlight');
    });

    // highlight buttons
    this.$refs.pageSlot.querySelectorAll('button').forEach($btn => {
      $btn.classList.remove('search-highlight');
      if (!$btn.querySelectorAll('mark').length) return;
      $btn.classList.add('search-highlight');
    });

    // scroll to the first highlighted element
    const $scrollToEl = this.$refs.pageSlot.querySelector('mark, .search-highlight');
    if ($scrollToEl) $scrollToEl.scrollIntoView({ block: 'nearest' });
  }

  private getPageInputs(): HTMLDivElement[] {
    return Array.from(this.$refs.pageSlot.querySelectorAll('[data-role="input"]')).filter(
      ($el: HTMLDivElement) => $el.matches(':not([data-search-exclude])'),
    ) as HTMLDivElement[];
  }

  private render(h: Function) {
    return (
      <div class={styles.searchablePages}>
        {this.loading && <Spinner />}
        <div ref="pageSlot">{this.$scopedSlots.default({ page: this.currentPage })}</div>
      </div>
    );
  }
}
