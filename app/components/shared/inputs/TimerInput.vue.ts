import { Component, Prop } from 'vue-property-decorator';
import { BaseInput } from './BaseInput';
import { ITimerMetadata } from './index';

let holdTimeout: number = null;
let holdInterval: number = null;

@Component({})
export default class TimerInput extends BaseInput<number, ITimerMetadata> {

  @Prop() value: number;
  @Prop() metadata: ITimerMetadata;

  hour = 3600;
  minute = 60;
  showTimerDropdown = false;
  max = this.metadata.max;
  min = this.metadata.min;
  format = this.metadata.format || 'ms';
  hasHours = /h/.test(this.format);
  hasSeconds = /s/.test(this.format);

  get hours() {
    return this.generateTime(this.max / 3600);
  }

  get minutes() {
    return this.generateTime(60);
  }

  get seconds() {
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
    const currentHour = Math.floor(this.value / 3600);
    return (hour == currentHour);
  }

  isActiveMinute(minute: number) {
    const currentMinute = Math.floor((this.value % 3600) / 60);
    return (minute == currentMinute);
  }

  isActiveSecond(second: number) {
    const currentSecond = Math.floor(((this.value % 3600) % 60) /60);
    return second == currentSecond;
  }

  setHour(val: number) {
    const currentMinsInSecs = Math.floor(this.value % 3600);
    const hour = val * 3600;
    this.updateValue(currentMinsInSecs + hour);
  }

  setMinute(val: number) {
    const currentHrsInSecs = Math.floor(this.value / 3600) * 3600;
    const minute = val * 60;
    this.updateValue(currentHrsInSecs + minute);
  }

  setSecond(val: number) {
    const currentMinsInSecs = Math.floor(this.value % 3600);
    this.updateValue(currentMinsInSecs + val);
  }

  updateValue(value: number) {
    this.$emit('input', value);
  }

  getHours(seconds: number) {
    const hour = Math.floor(seconds / 3600);
    return `${hour < 10 ? '0' : ''}${hour}`;
  }

  getMinutes(seconds: number) {
    const min = Math.floor((seconds % 3600) / 60);
    return `${min < 10 ? '0' : ''}${min}`;
  }

  getSeconds(seconds: number) {
    const sec = Math.floor(((seconds % 3600) % 60) / 60);
    return `${sec < 10 ? '0' : ''}${sec}`;
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