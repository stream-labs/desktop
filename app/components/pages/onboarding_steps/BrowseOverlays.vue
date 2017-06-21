<template>
  <div>
    <div class="onboarding-step onboarding-step--full">
      <div class="overlays-container">
        <div class="overlays-filters">
          <div class="search-input">
            <input type="text" placeholder="Search for games" />
            <i class="fa fa-search" />
          </div>
          <div class="filters">
            <div class="filter-group">
              <div class="filter-title">Games</div>
              <div class="filter-option">Massively Multiplayer Online</div>
              <div class="filter-option">Role-Playing Game</div>
              <div class="filter-option">First Person Shooter</div>
              <div class="filter-option">Sports</div>
              <div class="filter-option">Simulation</div>
              <div class="filter-option">1v1 Fighting</div>
              <div class="filter-option">Music/Dance</div>
            </div>
            <div class="filter-group">
              <div class="filter-title">Variety</div>
              <div class="filter-option">Arts/DIY</div>
              <div class="filter-option">Cosplay</div>
              <div class="filter-option">Automotive</div>
              <div class="filter-option">Food</div>
              <div class="filter-option">Music/Dance</div>
            </div>
            <div class="filter-group">
              <div class="filter-title">General</div>
              <div class="filter-desc">Use these to stream virtually anything</div>
              <div class="filter-option">Red</div>
              <div class="filter-option">Green</div>
              <div class="filter-option">Blue</div>
              <div class="filter-option">Flames</div>
              <div class="filter-option">Floral</div>
            </div>
          </div>
        </div>
        <div class="overlays-body">
          <div v-if="view == 'browseOverlays'">
            <div class="overlays-header">
              <div>
                <div class="onboarding-title--sm">Browse Overlays</div>
                <div>Filter by name or category and choose an overlay for your stream</div>
              </div>
              <list-input
                class="select--semi-opac"
                :value="listInputValue" />
            </div>
            <div class="overlays">
              <div class="overlay" 
                @click="viewDetails()">
                <div class="content">
                  <div class="overlay__name">CS:GO Metal</div>
                </div>
              </div>
              <div class="overlay">
                <div class="content">
                  <div class="overlay__name">CS:GO Red</div>
                </div>
              </div>
              <div class="overlay">
                <div class="content">
                  <div class="overlay__name">CS:GO Modern White</div>
                </div>
              </div>
              <div class="overlay">
                <div class="content">
                  <div class="overlay__name">CS:GO Luminous Green</div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="view == 'overlayDetails'">
            <div class="overlays-header">
              <div class="flex flex--center">
                <a class="back-arrow back-arrow--light" @click="viewOverlays()"><i class="fa fa-long-arrow-left" /></a>
                <div class="onboarding-title--sm">CS:GO Red</div>
              </div>
              <div><i class="fa fa-user" /> 362 installs</div>
            </div>
            <div class="overlay-details__img"></div>
            <div class="overlay-details__thumbnails">
              <div class="overlay-details__thumbnail"></div>
              <div class="overlay-details__thumbnail"></div>
              <div class="overlay-details__thumbnail"></div>
              <div class="overlay-details__thumbnail"></div>
              <div class="overlay-details__thumbnail"></div>
            </div>
          </div>
        </div>
        <div class="overlays-footer">
          <button class="button button--trans">Skip this step</button>
          <button class="button button--semi-opac">Select</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { ListInput } from '../../shared/forms';

@Component({
  components: {
    ListInput
  }
})
export default class BrowseOverlays extends Vue {
  view = 'overlayDetails';

  listInputValue = {
    name: 'type',
    value: 'My value',
    options: [
      { description: 'Most Popular', value: 'Most Popular' },
      { description: 'Newly Added', value: 'Newly Added' }
    ]
  };

  viewDetails() {
    this.view = 'overlayDetails';
  };
  viewOverlays() {
    this.view = 'browseOverlays';
  };
}
</script>

<style lang="less" scoped>
@import "../../../styles/index";
.overlays-container   {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  height: 100%;
  color: @grey;
}
.overlays-header { 
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  text-align: left;
}
.overlays-footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: lighten(@onboarding-bg, 3%);
  padding: 10px 20px;
  text-align: right;
}
.overlays-filters, .overlays-body {
  display: flex;
  padding: 20px;
  flex-direction: column;
  height: 100%;
}
.overlays-filters {
  width: 240px;
  background: darken(@onboarding-bg, 3%);
  text-align: left;
}
.overlays-body {
  flex-grow: 1;
}
.overlays {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.overlay {
  .aspect-ratio(16, 9);
  .radius;
  background: darken(@onboarding-bg, 3%);
  color: @white;
  width: 48%;
  margin-bottom: 20px;
  display: flex;
}
.overlay__name {
  position: absolute;
  left: 20px;
  bottom: 20px;
}
.filters {
  padding: 0 8px;
}
.filter-group {
  margin-bottom: 20px;
}
.filter-title {
  .semibold;
}
.filter-desc {
  font-size: 12px;
  margin-bottom: 8px;
}
.overlay-details__img {
  height: 500px;
  width: 100%;
  background-color: @night-primary;
  .radius;
}
.overlay-details__thumbnails {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
}
.overlay-details__thumbnail {
  .radius;
  width: 19%;
  height: 70px;
  background-color: @night-primary;
}
</style>