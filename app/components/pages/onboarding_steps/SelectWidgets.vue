<template>
  <div>
    <div class="onboarding-step onboarding-step--wide">
      <div class="onboarding-title">Select Widgets</div>
      <div class="onboarding-desc">
        Select the Streamlabs widgets you would like to activate for your stream. Whether it's donation alerts, the jar, or stream labels, we have you covered with a host of widgets.
      </div>
      <div class="select-widgets">
        <div class="select-widgets__column">
          <div class="select-widgets__column-title">Essentials</div>
          <div 
            class="widget selected"
            :class="{ active : details =='alertbox' }"
            @click="openDetails('alertbox')">
            <div class="widget__icon">
              <img src="../../../../media/images/icons/alertbox.png">
            </div>
            <div class="widget__info">
              <div class="widget__name">Alertbox</div>
              <div class="widget__desc">
                Thanks viewers with notification popups
              </div>
            </div>
          </div>
          <div 
            class="widget selected"
            :class="{ active : details =='eventlist' }"
            @click="openDetails('eventlist')">
            <div class="widget__icon">
              <img src="../../../../media/images/icons/event-list.png">
            </div>
            <div class="widget__info">
              <div class="widget__name">Event List</div>
              <div class="widget__desc">
                Most recent events into your stream
              </div>
            </div>
          </div>
          <div 
            class="widget selected"
            :class="{ active : details =='jar' }"
            @click="openDetails('jar')">
            <div class="widget__icon">
              <img src="../../../../media/images/icons/jar.png">
            </div>
            <div class="widget__info">
              <div class="widget__name">The Jar</div>
              <div class="widget__desc">
                A jar that catches bits, tips, and more
              </div>
            </div>
          </div>
        </div>
        <div class="select-widgets__column">
          <div class="select-widgets__column-title">Additional</div>
          <div class="widget"
            :class="{ active : details =='chatbox' }"
            @click="openDetails('chatbox')">
            <div class="widget__icon">
              <img src="../../../../media/images/icons/chatbox.png">
            </div>
            <div class="widget__info">
              <div class="widget__name">Chatbox</div>
              <div class="widget__desc">
                Your channel's chat in your stream
              </div>
            </div>
          </div>
          <div class="widget"
            :class="{ active : details =='donationTicker' }"
            @click="openDetails('donationTicker')">
            <div class="widget__icon">
              <img src="../../../../media/images/icons/donation-ticker.png">
            </div>
            <div class="widget__info">
              <div class="widget__name">Donation Ticker</div>
              <div class="widget__desc">
                Show off most recent donations to viewers
              </div>
            </div>
          </div>
          <div class="widget"
            :class="{ active : details =='donationGoal' }"
            @click="openDetails('donationGoal')">
            <div class="widget__icon">
              <img src="../../../../media/images/icons/donation-goal.png">
            </div>
            <div class="widget__info">
              <div class="widget__name">Donation Goal</div>
              <div class="widget__desc">
                Give your viewers a target to help you reach
              </div>
            </div>
          </div>
        </div>
      </div>
      <button class="button button--lg button--action">Next</button>

      <!-- Detail modals -->
      <div 
        class="widget-detail-wrapper"
        v-if="details == 'alertbox'">
        <div class="widget-detail">
          <div class="widget-detail__header">
            <div class="flex flex--center">
              <div class="widget__icon">
                <img src="../../../../media/images/icons/alertbox.png">
              </div>
              <div class="widget__info">
                <div class="widget__name">Alertbox</div>
                <div class="widget__desc">
                  Thanks viewers with notification popups
                </div>
              </div>
            </div>
            <div class="flex flex--center">
              <button class="button button--semi-opac">Remove Widget</button>
              <div 
                class="widget-detail-close"
                @click="closeDetails('alertbox')">
                <i class="fa fa-times" />
              </div>
            </div>
          </div>
          <div class="widget-detail__body">
            <video autoplay loop muted src="../../../../media/mp4/alertbox.mp4"></video>
          </div>
        </div>
      </div>
      <div 
        class="widget-detail-wrapper"
        v-if="details == 'eventlist'">
        <div class="widget-detail">
          <div class="widget-detail__header">
            <div class="flex flex--center">
              <div class="widget__icon">
                <img src="../../../../media/images/icons/event-list.png">
              </div>
              <div class="widget__info">
                <div class="widget__name">Eventlist</div>
                <div class="widget__desc">
                  Thanks viewers with notification popups
                </div>
              </div>
            </div>
            <div class="flex flex--center">
              <button class="button button--semi-opac">Remove Widget</button>
              <div 
                class="widget-detail-close"
                @click="closeDetails('eventlist')">
                <i class="fa fa-times" />
              </div>
            </div>
          </div>
          <div class="widget-detail__body">
            <video autoplay loop muted src="../../../../media/mp4/eventlist.mp4" autoplay></video>
          </div>
        </div>
      </div>
      <div 
        class="widget-detail-wrapper"
        v-if="details == 'jar'">
        <div class="widget-detail">
          <div class="widget-detail__header">
            <div class="flex flex--center">
              <div class="widget__icon">
                <img src="../../../../media/images/icons/jar.png">
              </div>
              <div class="widget__info">
                <div class="widget__name">Jar</div>
                <div class="widget__desc">
                  Thanks viewers with notification popups
                </div>
              </div>  
            </div>
            <div class="flex flex--center">
              <button class="button button--semi-opac">Remove Widget</button>
              <div 
                class="widget-detail-close"
                @click="closeDetails('jar')">
                <i class="fa fa-times" />
              </div>
            </div>
          </div>
          <div class="widget-detail__body">
            <video autoplay loop muted src="../../../../media/mp4/jar.mp4"></video>
          </div>
        </div>
      </div>
      <div 
        class="widget-detail-wrapper"
        v-if="details == 'chatbox'">
        <div class="widget-detail">
          <div class="widget-detail__header">
            <div class="flex flex--center">
              <div class="widget__icon">
                <img src="../../../../media/images/icons/chatbox.png">
              </div>
              <div class="widget__info">
                <div class="widget__name">Chatbox</div>
                <div class="widget__desc">
                  Thanks viewers with notification popups
                </div>
              </div>
            </div>
            <div class="flex flex--center">
              <button class="button button--semi-opac">Remove Widget</button>
              <div 
                class="widget-detail-close"
                @click="closeDetails('chatbox')">
                <i class="fa fa-times" />
              </div>
            </div>
          </div>
          <div class="widget-detail__body">
            <video autoplay loop muted src="../../../../media/mp4/chatbox.mp4"></video>
          </div>
        </div>
      </div>
       <div 
        class="widget-detail-wrapper"
        v-if="details == 'donationTicker'">
        <div class="widget-detail">
          <div class="widget-detail__header">
            <div class="flex flex--center">
              <div class="widget__icon">
                <img src="../../../../media/images/icons/donation-ticker.png">
              </div>
              <div class="widget__info">
                <div class="widget__name">Donation Ticker</div>
                <div class="widget__desc">
                  Thanks viewers with notification popups
                </div>
              </div>
            </div>
            <div class="flex flex--center">
              <button class="button button--semi-opac">Remove Widget</button>
              <div 
                class="widget-detail-close"
                @click="closeDetails('donationTicker')">
                <i class="fa fa-times" />
              </div>
            </div>
          </div>
          <div class="widget-detail__body">
            <video autoplay loop muted src="../../../../media/mp4/donation-ticker.mp4"></video>
          </div>
        </div>
      </div>
       <div 
        class="widget-detail-wrapper"
        v-if="details == 'donationGoal'">
        <div class="widget-detail">
          <div class="widget-detail__header">
            <div class="flex flex--center">
              <div class="widget__icon">
                <img src="../../../../media/images/icons/donation-goal.png">
              </div>
              <div class="widget__info">
                <div class="widget__name">Donation Goal</div>
                <div class="widget__desc">
                  Thanks viewers with notification popups
                </div>
              </div>
            </div>
            <div class="flex flex--center">
              <button class="button button--semi-opac">Remove Widget</button>
              <div 
                class="widget-detail-close"
                @click="closeDetails('donationGoal')">
                <i class="fa fa-times" />
              </div>
            </div>
          </div>
          <div class="widget-detail__body">
            <video autoplay loop muted src="../../../../media/mp4/donation-goal.mp4"></video>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

@Component({})
export default class SelectWidgets extends Vue {

  details: string = '';
 
  openDetails(details: string) {
    this.details = details;
  }
  closeDetails() {
    this.details = '';
  }

}
</script>

<style lang="less" scoped>
@import "../../../styles/index";

.select-widgets {
  display: flex;
  margin: 20px 0;
}
.select-widgets__column {
  padding: 0 15px;
}
.select-widgets__column-title {
  .semibold;
  color: @white;
  font-size: 14px;
}
.widget {
  margin-top: 20px;
  border: 2px solid transparent;
  .radius;
  background: @night-select-bg;
  padding: 20px;
  width: 200px;
  text-align: left;
  display: flex;
  cursor: pointer;
  width: 360px;
  .transition;
  &:hover {
    border-color: @teal-light-opac;
  }
  &.selected {
    border-color: @teal-bright;
  }
}
.widget__icon {
  width: 40px;
  margin-right: 20px;
}
.widget__info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: left;
}
.widget__name {
  .semibold;
  color: @white;
  font-size: 14px;
}
.widget__desc {
  color: @grey;
}
.widget-detail-wrapper {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  background: rgba(43,56,63, .85);
  display: flex;
  justify-content: center;
  align-items: center;
}
.widget-detail {
  .radius;
  background: @night-select-bg;
  overflow: hidden;
  width: 80%;
  min-width: 550px;
  max-width: 750px;
}
.widget-detail-close {
  color: @grey;
  .transition;
  margin-left: 20px;
  cursor: pointer;
  &:hover {
    color: @white;
  }
}
.widget-detail__header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
}
.widget-detail__body {
  overflow: hidden;
  video {
    width: 102%;
    display: flex;
    margin: -3px -1% -1px -1%;
  }
}
</style>