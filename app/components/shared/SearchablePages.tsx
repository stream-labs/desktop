import TsxComponent from 'components/tsx-component';
import { Component, Prop, Watch } from 'vue-property-decorator';
import Mark from 'mark.js';
import styles from './SearchablePages.m.less';

interface IPageInfo {
  text: string;
  inputs: string[];
}

@Component({})
export default class SearchablePages extends TsxComponent<{
  page: string;
  pages: string[];
}> {
  @Prop() page: string;
  @Prop() pages: string[];
  @Prop() searchStr: string;
  currentPage: string = this.page || '';
  pagesInfo: Dictionary<IPageInfo> = null;
  searchResultPages: string[];

  $refs: {
    pageSlot: HTMLDivElement;
  };

  @Watch('searchStr')
  private async onSearchHandler(searchStr: string) {
    if (!this.pagesInfo) {
      await this.scanPages();
    }
    const searchResultPages: string[] = [];
    Object.keys(this.pagesInfo).forEach(pageName => {
      const pageInfo = this.pagesInfo[pageName];
      const pageText = pageInfo.text + pageInfo.inputs.join(' ');
      if (pageText.match(new RegExp(searchStr, 'i'))) searchResultPages.push(pageName);
    });
    this.searchResultPages = searchResultPages;
    await this.$nextTick();
    this.$emit('searchCompleted', this.searchResultPages);
    await this.$nextTick();
    await this.highlightPage();
  }

  @Watch('page')
  private async onPageChangeHandler(page: string) {
    this.currentPage = page;
    if (this.searchStr && this.pagesInfo) {
      await this.$nextTick();
      await this.highlightPage();
    }
  }

  private async scanPages() {
    this.pagesInfo = {};
    for (const page of this.pages) {
      this.$emit('beforePageScan', page);
      // render the page
      this.currentPage = page;
      await this.$nextTick();

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
    this.currentPage = this.page;
    await this.$nextTick();
    this.$emit('scanCompleted');
  }

  private async highlightPage() {
    // highlight the page text via Mark.js
    const mark = new Mark(this.$refs.pageSlot);
    mark.unmark();
    if (this.searchStr) {
      mark.mark(this.searchStr);
    }

    // highlight inputs
    const pageInfo = this.pagesInfo[this.page];
    this.getPageInputs().forEach(($input, ind) => {
      $input.classList.remove('search-highlight');
      const needHighlight =
        this.searchStr && pageInfo.inputs[ind].match(new RegExp(this.searchStr, 'i'));
      if (needHighlight) $input.classList.add('search-highlight');
    });

    // highlight buttons
    this.$refs.pageSlot.querySelectorAll('button').forEach($btn => {
      $btn.classList.remove('search-highlight');
      if (!$btn.querySelectorAll('mark').length) return;
      $btn.classList.add('search-highlight');
    });
  }

  private getPageInputs(): HTMLDivElement[] {
    return Array.from(this.$refs.pageSlot.querySelectorAll('[data-role="input"]'));
  }

  private render(h: Function) {
    return (
      <div class={styles.searchablePages}>
        <div ref="pageSlot">{this.$scopedSlots.default({ page: this.currentPage })}</div>
      </div>
    );
  }
}
