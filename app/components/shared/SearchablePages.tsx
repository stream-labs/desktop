import TsxComponent from 'components/tsx-component';
import { Component, Prop, Watch } from 'vue-property-decorator';
import Mark from 'mark.js';
import styles from './SearchablePages.m.less';

interface IPageInfo {
  text: string;
}

interface IPageSearchResult {
  text: number[];
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
  pagesIndex: Dictionary<IPageInfo> = null;
  searchResult: Dictionary<IPageSearchResult> = {};
  searchResultPages: string[];

  $refs: {
    pageSlot: HTMLDivElement;
  };

  @Watch('searchStr')
  private async onSearchHandler(searchStr: string) {
    await this.updateIndex();
    const searchResultPages: string[] = [];
    Object.keys(this.pagesIndex).forEach(pageName => {
      const pageIndex = this.pagesIndex[pageName];
      if (pageIndex.text.indexOf(searchStr) !== -1) searchResultPages.push(pageName);
    });
    this.searchResultPages = searchResultPages;
    await this.$nextTick();
    this.highlightPage();
    this.$emit('searchCompleted', this.searchResultPages);
  }

  @Watch('page')
  private async onPageChangeHandler(page: string) {
    this.currentPage = page;
  }

  private async updateIndex() {
    this.pagesIndex = {};
    for (const page of this.pages) {
      // render a page
      this.currentPage = page;
      await this.$nextTick();

      this.pagesIndex[page] = {
        text: this.$refs.pageSlot.innerText,
      };
    }
    this.currentPage = this.page;
    console.log('index updated', this.pagesIndex);
  }

  private highlightPage() {
    const mark = new Mark(this.$refs.pageSlot);
    mark.mark(this.searchStr);
  }

  private render(h: Function) {
    console.log('re-render');
    return (
      <div class={styles.searchablePages}>
        Searchable pages
        <div ref="pageSlot">{this.$scopedSlots.default({ page: this.currentPage })}</div>
      </div>
    );
  }
}
