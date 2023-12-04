
<template>
  <div class="modal-layout">
    <multiselect v-model="deviceModel" :options="deviceList" label="description" trackBy="value" :allow-empty="false" />
    <div class="aaa">
      <div>

        <!-- <NavMenu v-model="currentIndex" class="side-menu" data-test="SideMenu">
          <div>プリセットボイス</div>
          <NavItem v-for="v in presetList" :key="v.value" :to="v.value">{{ v.name }} </NavItem>

          <div>オリジナルボイス
          </div>
          <NavItem v-for="v in orginalList" :key="v.value" :to="v.value">{{ v.name }} </NavItem>

          <div>
            <div> temp conrols </div>
            <button @click="onAdd">[add]</button>
            <li v-for="v in orginalList">{{ v.name }}
              <button @click="onDelete(v.value)">[del]</button>
              <button @click="onCopy(v.value)">[copy]</button>
            </li>
          </div>
        </NavMenu> -->


        <ul class="nav-menu">
          <div>プリセットボイス</div>
          <li v-for="v in presetList" :key="v.value" class="nav-item" :class="{ active: v.value === currentIndex }">
            <div class=" nav-item__content" @click="onSelect(v.value)">
              {{ v.name }}
            </div>
          </li>

          <div>オリジナルボイス ({{ manualList.length }}/{{ manualMax }})
            <div @click="onAdd()">[+]</div>
          </div>
          <li v-for="v in manualList" :key="v.value" class="nav-item" :class="{ active: v.value === currentIndex }">
            <div class="nav-item__content" @click="onSelect(v.value)"> {{ v.name }}</div>
            <div class="nav-item__right">
              <div class="dropdown">
                <span>... </span>
                <div class="dropdown-content">
                  <div @click="onDelete(v.value)">削除</div>
                  <div @click="onCopy(v.value)">複製</div>
                </div>
              </div>
            </div>

          </li>
        </ul>

      </div>

      <div class="content-container">
        <div v-if="isPreset">
          <img :src="image">
        </div>

        <div v-else>
          <div class="section">
            <div class="input-container">

              <div class="input-label"><label>名前</label></div>
              <div class="input-wrapper">
                <input type="text" v-model="name" />
              </div>

            </div>
          </div>

          <div class="section">
            <div class="input-container">

              <div class="input-label"><label>音声設定</label></div>

              <div class="input-label"><label>声の高さ {{ pitchShift.toFixed(2) + 'cent' }} </label></div>
              <div class="input-wrapper">
                <VueSlider v-model="pitchShift" :min="-6.00" :max="6.00" :interval="0.1" tooltip="none" />
              </div>


              <div class="input-label"><label>ボイス1</label></div>
              <div class="input-wrapper">
                <multiselect v-model="primaryVoiceModel" :options="primaryVoiceList" label="description" trackBy="value"
                  :allow-empty="false" />
              </div>


              <div class="input-label"><label>ボイス2</label></div>
              <div class="input-wrapper">
                <multiselect v-model="secondaryVoiceModel" :options="secondaryVoiceList" label="description"
                  trackBy="value" :allow-empty="false" />
              </div>

              <div class="input-label"><label>割合 {{ amount.toFixed(2) + '%' }}</label></div>
              <div class="input-wrapper">
                <VueSlider v-model="amount" :min="0" :max="100" :interval="0.1" tooltip="none" />
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="modal-layout-controls">
      <div style="width: 100px; padding: 4px;">
        <multiselect v-model="deviceModel" :options="deviceList" label="description" trackBy="value"
          :allow-empty="false" />
      </div>

      <div style="margin-right: auto;"><span>適用音声を聞く</span>
        <input v-model="isMonitor" type="checkbox" class="toggle-button" />
      </div>

      <button class="button button--secondary" @click="cancel">
        キャンセル </button>
      <button class="button button--primary" @click="done">
        完了 </button>
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

.ModalLayout-fixed {
  z-index: 1;
  flex-shrink: 0;
}

.modal-layout-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
  padding: 16px;
  overflow-x: hidden;
  overflow-y: auto;
}

.modal-layout-controls {
  .dividing-border(top);

  z-index: @z-index-default-content;
  display: flex;
  flex-shrink: 0;
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


.aaa {
  display: flex;
  align-content: stretch;
  align-items: stretch;
  height: 100%;
  overflow: hidden;
}

.side-menu {
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
      label {
        margin-bottom: 4px;
      }
    }
  }
}

.nav-menu {
  display: flex;
  flex: 0 0 232px;
  flex-direction: column;
  width: 200px;
  padding: 8px 0;
  padding-right: 4px;
  margin: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 40px;
  padding: 0;
  padding-left: 16px;
  font-size: @font-size4;
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

.nav-item__content {
  overflow: hidden;
  line-height: 14px;
  // max-width: calc(~"100% - 20px");
  // width: 100%;
  // max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item__right {
  margin-left: auto;
}

.dropdown {
  position: relative;
  display: inline-block;
  width: 30px;
  height: 30px;
}

.dropdown-content {
  position: absolute;
  z-index: 10;
  display: none;
  min-width: 160px;
  padding: 12px 16px;
  background-color: gray;
}

.dropdown:hover .dropdown-content {
  display: block;
}
</style>


