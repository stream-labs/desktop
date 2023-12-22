
<template>
  <div class="modal-layout">
    <div class="tab">
      <button class="item" :class="{ 'active': tab == 0 }" @click="onTab(0)">
        ボイス設定</button>
      <button class="item" :class="{ 'active': tab == 1 }" @click="onTab(1)">
        マイク設定</button>
    </div>

    <div v-if="tab == 0" class="content">
      <div>
        <ul class="nav-menu">
          <div style="padding-left:4px; font-weight: bold; color: white;">プリセットボイス</div>
          <li v-for="v in presetList" :key="v.value" class="nav-item" :class="{ active: v.value === currentIndex }">
            <div class="nav-item-content" @click="onSelect(v.value)">
              <img :src="v.icon" style="padding-right: 4px;">
              {{ v.name }}
            </div>
          </li>

          <div style="display: flex; padding-top: 16px; ">
            <div style="width:100%;padding-left:4px; font-weight: bold; color: white;">オリジナルボイス ({{ manualList.length
            }}/{{ manualMax }})
            </div>
            <button v-if="canAdd" @click="onAdd()" style=" width:30px; color:white; text-align: center">＋</button>
            <button v-else style=" width:30px; color:gray; text-align: center">＋</button>

          </div>
          <li v-for="v in manualList" :key="v.value" class="nav-item" :class="{ active: v.value === currentIndex }">
            <div class="nav-item-content" @click="onSelect(v.value)"> <img :src="v.icon" style="padding-right: 4px;">
              {{ v.name }}</div>
            <div class="nav-item-right">
              <div class="dropdown">
                <button style="color:white">︙</button>
                <div class="dropdown-content">
                  <div @click="onDelete(v.value)" style="color: red;">ボイスを削除</div>
                  <div @click="onCopy(v.value)" style="color:white">ボイスを複製</div>
                </div>
              </div>
            </div>

          </li>
        </ul>

      </div>

      <div class="content-container">
        <div v-if="isPreset">
          <img :src="image" style="max-height: 350px;">
          <div class="input-container">
            <div class="input-label">
              <label>{{ $t('source-props.nair-rtvc-source.pitch_shift.name') }}</label>
              <label> {{ pitchShift.toFixed(0) + ' cent' }} </label>
            </div>
            <div class="input-wrapper">
              <VueSlider v-model="pitchShift" :min="-1200.00" :max="1200.00" :interval="0.1" tooltip="none" />
            </div>
          </div>
        </div>

        <div v-else>
          <div class="section">
            <div class="input-container">

              <div style=" width: 100%; padding-bottom: 4px;font-weight: bold; color: white;">名前</div>
              <div class="input-wrapper">
                <input type="text" v-model="name" />
              </div>

            </div>
          </div>

          <div class="section">
            <div class="input-container">

              <div style="display:flex; width: 100%; padding-bottom: 8px;">
                <div style=" width: 100%;font-weight: bold; color: white;">音声設定 </div>
                <button class="button-inline" @click="onRandom">ランダムで生成 </button>
                <i class="icon-help icon-btn tooltip1" style="color:var(--color-button-primary)">
                  <div class="tooltip1_text" style="left: -200px;">ランダムで設定して生成します</div>
                </i>
              </div>

              <div class="input-label">
                <label>{{ $t('source-props.nair-rtvc-source.pitch_shift.name') }}</label>
                <label> {{ pitchShift.toFixed(0) + ' cent' }} </label>
              </div>
              <div class="input-wrapper">
                <VueSlider v-model="pitchShift" :min="-1200.00" :max="1200.00" :interval="0.1" tooltip="none" />
              </div>

              <div class="input-label"><label>{{ primaryVoiceModelLabel }}</label></div>
              <div class="input-wrapper">
                <multiselect v-model="primaryVoiceModel" :options="primaryVoiceList" label="description" trackBy="value"
                  :allow-empty="false" :placeholder="$t('settings.listPlaceholder')" />
              </div>

              <div class="input-label"><label>{{ secondaryVoiceModelLabel }}</label></div>
              <div class="input-wrapper">
                <multiselect v-model="secondaryVoiceModel" :options="secondaryVoiceList" label="description"
                  trackBy="value" :allow-empty="false" :placeholder="$t('settings.listPlaceholder')" />
              </div>

              <div v-if="secondaryVoice >= 0" style="width: 100%;">
                <div class="input-label">
                  <div style="display: flex;">
                    <label>{{ $t('source-props.nair-rtvc-source.amount.name') }}</label>
                    <i class="icon-help icon-btn tooltip1" style="color:var(--color-button-primary)">
                      <div class="tooltip1_text">{{ amountDescription }}</div>
                    </i>
                  </div>
                  <label> {{ amount.toFixed(0) + '%' }}</label>
                </div>
                <div class="input-wrapper">
                  <VueSlider v-model="amount" :min="0" :max="100" :interval="0.1" tooltip="none" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>

    <div v-if="tab == 1" class="content">
      <div class="content-container">
        <div class="section">
          <div class="input-container">

            <div class="input-label"><label>{{ deviceModelLabel }}</label></div>
            <div class="input-wrapper">
              <multiselect v-model="deviceModel" :options="deviceList" label="description" trackBy="value"
                :allow-empty="false" :placeholder="$t('settings.listPlaceholder')" />
            </div>

            <div class="input-label"><label>{{ latencyModelLabel }}</label></div>
            <div class="input-wrapper">
              <multiselect v-model="latencyModel" :options="latencyList" label="description" trackBy="value"
                :allow-empty="false" :placeholder="$t('settings.listPlaceholder')" />
            </div>

          </div>
        </div>
      </div>
    </div>

    <div class="modal-layout-controls">

      <div style="margin-right: auto; margin-left: 16px;"><span>適用音声を聞く</span>
        <input v-model="isMonitor" type="checkbox" class="toggle-button" />
      </div>

      <button class="button button--secondary" @click="cancel">
        {{ $t('common.cancel') }} </button>
      <button class="button button--primary" @click="done">
        {{ $t('common.done') }} </button>
    </div>
  </div>
</template>

<script lang="ts" src="./RtvcSourceProperties.vue.ts"></script>

<style lang="less" scoped>
@import url("../../styles/index");

.modal-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg-quinary);
}

.modal-layout-controls {
  .dividing-border(top);

  z-index: @z-index-default-content;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  text-align: right;
  background-color: var(--color-bg-primary);

  div {
    display: flex;
    justify-content: flex-end;
  }

  &:not(:empty) {
    padding: 8px 16px;
  }

  .button {
    .margin-left();
  }
}


.content {
  display: flex;
  align-content: stretch;
  align-items: stretch;
  height: 100%;
  overflow: hidden;
}

.content-menu {
  width: 200px;
  overflow-y: auto;
}


.content-container {
  flex-grow: 1;
  padding: 16px 8px 0 0;
  margin: 0;
  overflow-x: auto;
  overflow-y: scroll;

  .input-container {
    flex-direction: column;

    .input-label,
    .input-wrapper {
      width: 100%;
    }

    .input-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      color: var(--color-text);

      label {
        color: var(--color-text);
      }
    }
  }
}

.nav-menu {
  width: 200px;
  padding: 8px;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 40px;
  padding: 0;
  padding-left: 2px;
  font-size: @font-size4;
  line-height: 40px;
  color: var(--color-text);
  list-style: none;
  cursor: pointer;

  &.active {
    color: var(--color-text-active);
  }

  &:not(.active):hover {
    color: var(--color-text-light);
  }
}

.nav-item-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item-right {
  margin-left: auto;
}

.dropdown {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 40px;
  line-height: 40px;
  text-align: center;
}

.dropdown-content {
  position: absolute;
  top: 0;
  z-index: 10;
  display: none;
  width: 140px;
  padding: 12px 16px;
  line-height: 30px;
  background-color: var(--color-bg-primary);
}

.dropdown:hover .dropdown-content {
  display: block;
}

.tab {
  display: flex;
  padding: 16px 4px;

  .item {
    flex: 1;
    font-weight: bold;
    line-height: 25px;
    color: var(--color-text-dark);
    text-align: center;
    border-bottom: 2px solid var(--color-text-dark);

    &.active {
      color: var(--color-text-light);
      border-bottom: 2px solid var(--color-text-light);
    }
  }
}

.button-inline {
  font-weight: bold;
  color: var(--color-button-primary);
  white-space: nowrap;
}

.tooltip1 {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.tooltip1_text {
  position: absolute;
  display: none;
  width: 200px;
  padding: 10px;
  font-size: 12px;
  line-height: 1.6em;
  color: var(--color-text-light);
  background: black;
  // background: var(--color-bg-primary);
  border-radius: 5px;
}

.tooltip1:hover .tooltip1_text {
  display: block;
}
</style>


