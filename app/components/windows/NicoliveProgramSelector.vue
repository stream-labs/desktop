<template>
<modal-layout
  :title="$t('streaming.nicoliveProgramSelector.title')"
  :show-controls="false"
  :custom-controls="true">
  <div slot="content">
    <p class="caption" v-html="$t('streaming.nicoliveProgramSelector.description')" />
    <fieldset>
      <ul class="program-list">
        <li v-for="(info, key) in selectionInfo" :key="key" class="program">
          <input type="radio" :id="key" :value="key" v-model="selectedId">
          <label :for="key" class="program-infomation">
            <p class="title">{{ info.title }}</p>
            <p class="description">
              <span class="lv">{{ key }}</span>
              {{ info.description }}
            </p>
          </label>
        </li>
      </ul>
    </fieldset>
  </div>
  <div slot="controls">
    <button
      class="button button--default"
      @click="cancel"
      data-test="Cancel">
      {{ $t('streaming.nicoliveProgramSelector.cancel') }}
    </button>
    <button
      class="button button--action"
      :disabled="disabledOk"
      @click="ok"
      data-test="Done">
      {{ $t('streaming.nicoliveProgramSelector.done') }}
    </button>
  </div>
</modal-layout>
</template>

<script lang="ts" src="./NicoliveProgramSelector.vue.ts"></script>

<style lang="less" scoped>
@import "../../styles/_colors";
.caption {
  letter-spacing: .1em;
  font-size: 18px;
  font-style: normal;
  text-align: center;
  color: @text-primary;
  margin-bottom: 16px;
}
.program-list {
  margin-left: 0;
  width: 668px;
  > li {
    list-style: none;
  }
}

.program {
  position: relative;
  margin-bottom: 16px;
  border-bottom: 2px solid @bg-secondary;
  &:last-child {
    border-bottom: none;
  }

  //ラジオボタン非選択時
  label {
    width: 100%;
    display: block;
    text-align: left;
    margin-left: 0;
    margin-right: 0;
    cursor: pointer;
    position: relative;
    z-index: 2;
    transition: color 200ms ease-in;
    overflow: hidden;
    color: @text-secondary;
    .title {
      display: inline-block;
      font-size: 16px;
      text-indent: 1.3em;
      margin-bottom: 0;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      box-sizing: border-box;
    }
    .description {
      display: inline-block;
      font-size: 14px;
      margin-bottom: 0;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      box-sizing: border-box;
      .lv {
        font-size: 12px;
        background-color: @text-secondary;
        color: @bg-primary;
        border-radius: 2px;
        padding: 2px 4px;
      }
    }
    &:before {
      width: 16px;
      height: 16px;
      content: '';
      border: 2px solid @grey;
      background-color: rgba(145, 151, 154, .1);
      border-radius: 50%;
      cursor: pointer;
      transition: all 200ms ease-in;
      position: absolute;
      left: 0;
      top: 4px;
      z-index: 2;
    }
    &:after {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      content: '';
      background-color: @text-primary;
      position: absolute;
      left: 5px;
      top: 9px;
      transition: all 300ms cubic-bezier(0.4, 0.0, 0.2, 1);
      opacity: 0;
      z-index: 100;
    }
  }

  //ラジオボタン選択時
  input:checked ~ label {
    .title {
      color: @text-primary;
    }
    .description {
      .lv {
        color: @text-secondary;
      }
      .lv {
        background-color: @text-primary;
        color: @bg-primary;
      }
    }
    &:before {
      border-color: @text-primary;
      background-color: rgba(158, 234, 249, .1);
    }
    &:after {
      opacity: 1;
    }
  }

  input {
    position: absolute;
    left: 4px;
    top: 4px;
    z-index: 2;
    margin-bottom: 0;
    width: 16px;
    height: 16px;
    order: 1;
    cursor: pointer;
    visibility: hidden;
  }
}

</style>
