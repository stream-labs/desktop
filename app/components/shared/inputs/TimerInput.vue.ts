import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { INumberMetadata } from './index';

let holdTimeout: number = null;
let holdInterval: number = null;

@Component({})
export default class TimerInput extends BaseInput<number, INumberMetadata> {

  @Prop() value: number;
  @Prop() metadata: INumberMetadata;

  hour = 3600;
  minute = 60;
  showTimerDropdown = false;
  max = this.metadata.max;
  min = this.metadata.min;

  get hours() {
    return this.generateTime(this.max / 3600);
  }

  get minutes() {
    return this.generateTime(60);
  }

  hideTimerDropdown(){
    this.showTimerDropdown = false;
  }

  generateTime(time: number){
    const times: string[] = [];

    for(let num = 0; num < time; num++) {
      const fill = num > 9 ? '' : '0';
      times.push(fill + num);
    }

    return times;
  }

  isActiveHour(hour: number) {
    const current_hour = Math.floor(this.value / 3600);
    return (hour == current_hour);
  }

  isActiveMinute(minute: number) {
    const current_minute = Math.floor((this.value % 3600) / 60);
    return (minute == current_minute);
  }

  setHour(val: number) {
    const current_value = this.value; // extract the minutes for later
    const current_minutes_in_seconds = Math.floor(current_value % 3600);
    const hour = val * 3600;
    const new_time = current_minutes_in_seconds + hour;

    this.updateValue(new_time);
  }

  setMinute(val: number) {
    const current_value = this.value;
    const current_hours_in_seconds = Math.floor(current_value / 3600) * 3600;
    const minute = val * 60;
    const new_time = current_hours_in_seconds + minute;

    this.updateValue(new_time);
  }

  updateValue(value: number) {
    this.$emit('input', value);
  }

  getHours(seconds: number) {
    const hou = Math.floor(seconds / 3600);
    return `${hou < 10 ? '0' : ''}${hou}`;
  }

  getMinutes(seconds: number) {
    const min = Math.floor((seconds % 3600) / 60);
    return `${min < 10 ? '0' : ''}${min}`;
  }

  increment(unitInSeconds: number) {
    let val = this.value + unitInSeconds <= this.max ? this.value + unitInSeconds : this.max;
    this.updateValue(val);
  }

  decrement(unitInSeconds: number) {
    const bot = this.min >= 0 && this.min < this.max ? this.min : 0;
    let val = this.value - unitInSeconds >= bot ? this.value - unitInSeconds : bot;
    this.updateValue(val);
  }

  beginHold(callback: Function, param: any) {
    callback(param);
    holdTimeout = setTimeout(() => {
      holdInterval = setInterval(function() {
        callback(param);
      }, 100);
    }, 500);
  }

  releaseHold() {
    if(holdTimeout !== null) {
      clearTimeout(holdTimeout);
      holdTimeout = null;
    }
    if(holdInterval !== null) {
      clearInterval(holdInterval);
      holdInterval = null;
    }
  }
}