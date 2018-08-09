import Vue from 'vue';
import { NewsBannerService} from 'services/news-banner';
import { Inject } from 'util/injector';

export default class NewsBanner extends Vue {
  @Inject() newsBannerService: NewsBannerService;
}
