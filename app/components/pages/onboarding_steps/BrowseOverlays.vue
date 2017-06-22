<template>
  <div>
    <div class="onboarding-step onboarding-step--full">
      <div class="overlays-container">
        <div class="overlays-filters">
          <div class="search-input search-input--trans">
            <input type="text" placeholder="Search for games" />
            <i class="fa fa-search" />
          </div>
          <div class="filters">
            <div class="filter-group">
              <div class="filter-title">Games</div>
              <div class="filter-option">MMO</div>
              <div class="filter-option">RPG</div>
              <div class="filter-option selected">FPS</div>
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
              <div class="filter-option">Red</div>
              <div class="filter-option">Green</div>
              <div class="filter-option">Blue</div>
              <div class="filter-option">Flames</div>
              <div class="filter-option">Floral</div>
            </div>
          </div>
        </div>
        <div class="overlays-body">
          <div v-if="view == 'browseOverlays'" class="flex flex--column">
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
          <div v-if="view == 'overlayDetails'" class="overlay-details">
            <div class="overlays-header">
              <div class="flex flex--start">
                <a class="back-arrow back-arrow--light" @click="viewOverlays()"><i class="fa fa-long-arrow-left" /></a>
                <div>
                  <div class="onboarding-title--sm">CS:GO Red</div>
                  <div class="desc">Our red future overlay for Counter Strike: Global Offensive has finally arrived!</div>
                </div>
              </div>
              <div><i class="fa fa-user" /> 362 installs</div>
            </div>
            <div class="overlay-details-images">
              <div class="overlay-details__main"><img src="../../../../media/images/overlay-placeholder.jpg"></div>
              <div class="overlay-details__thumbnails">
                <div class="overlay-details__thumbnail"><img src="../../../../media/images/overlay-placeholder.jpg"></div>
                <div class="overlay-details__thumbnail selected"><img src="../../../../media/images/overlay-placeholder.jpg"></div>
                <div class="overlay-details__thumbnail"><img src="../../../../media/images/overlay-placeholder.jpg"></div>
                <div class="overlay-details__thumbnail"><img src="../../../../media/images/overlay-placeholder.jpg"></div>
                <div class="overlay-details__thumbnail"><img src="../../../../media/images/overlay-placeholder.jpg"></div>
              </div>
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
  view = 'browseOverlays';

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
  padding-bottom: 56px;
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent!important;
  }
  ::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,.08);
    border: none;
    border-radius: 3px;
  }
}
.overlays-header { 
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  text-align: left;
  padding: 8px;
  flex: 0 0 56px;
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
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: 230px;
  background: darken(@onboarding-bg, 3%);
  text-align: left;
}
.overlays-body {
  flex: 1;
}
.overlays {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px;
  margin-bottom: 8px;
  .overlay {
    &:nth-child(1), &:nth-child(2) {
      margin-top: 0;
    }
  }
}
.overlay {
  .aspect-ratio(16, 9);
  .radius;
  background: darken(@onboarding-bg, 3%);
  color: @white;
  width: 48%;
  margin-top: 20px;
  display: flex;
  background-image: url('../../../../media/images/overlay-placeholder.jpg');
  background-size: contain;
  cursor: pointer;
}
.overlay__name {
  position: absolute;
  left: 20px;
  bottom: 20px;
}
.filters {
  padding: 0 8px 8px;
  overflow-y: auto;
  .filter-group {
    &:last-child {
      margin-bottom: 0;
    }
  }
}
.filter-group {
  margin-bottom: 20px;
  .filter-option {
    &:last-child {
      margin-bottom: 0;
    }
  }
}
.filter-title {
  .semibold;
  font-size: 14px;
  margin-bottom: 8px;
}
.filter-option {
  .transition;
  margin-bottom: 4px;
  cursor: pointer;
  &:hover {
    color: @white;
  }
  &.selected {
    color: @teal-bright;
  }
}
.overlay-details {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.overlay-details-images {
  padding: 0 8px 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0px;
  height: 100%;
}
.overlay-details__main {
  background: darken(@onboarding-bg, 3%);
  .radius;
  align-items: center;
  justify-content: center;
  display: flex;
  flex: 0 0 80%;
  img {
    max-height: 100%;
  }
}
.overlay-details__thumbnails {
  display: flex;
  flex-wrap: nowrap;
  justify-content: space-between;
  align-items: center;
  flex: 1 0 10%;
  max-width: 800px;
  padding: 0 50px;
  margin: 0 auto;
}
.overlay-details__thumbnail {
  .radius;
  cursor: pointer;
  background: darken(@onboarding-bg, 3%);
  border: 2px solid transparent;
  max-width: 17%;
  max-height: 100%;
  &:hover {
    border-color: @teal-light-opac;
  }
  &.selected {
    border-color: @teal-bright;
  }
  img {
    max-height: 100%;
    width: auto;
  }
}
</style>