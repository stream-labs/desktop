import { mutation, PersistentStatefulService, ViewHandler } from 'services/core';

interface ITwitchTagsState {
  tags: string[];
}

class TwitchTagsViews extends ViewHandler<ITwitchTagsState> {
  get tags() {
    return this.state.tags;
  }

  get hasTags() {
    return this.state.tags.length > 0;
  }
}

export class TwitchTagsService extends PersistentStatefulService<ITwitchTagsState> {
  static defaultState: ITwitchTagsState = { tags: [] };

  get views() {
    return new TwitchTagsViews(this.state);
  }

  setTags(tags: string[]) {
    this.SET_TWITCH_TAGS(tags);
  }

  @mutation()
  SET_TWITCH_TAGS(tags: string[]) {
    this.state.tags = tags;
  }
}
