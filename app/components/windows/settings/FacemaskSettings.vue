<template>
  <div slot="content">
    <div class="row">
      <input-wrapper :title="$t('Face Masks Enabled')">
        <toggle-input
          v-model="enabledModel"
          name="enabled"
          @input="handleSubmit"
          :metadata="{ title: $t('Enable Face Masks') }"
        />
      </input-wrapper>
    </div>
    <div class="row">
      <input-wrapper :title="$t('Video Device')">
        <list-input
          v-model="videoInputModel"
          :metadata="videoInputMetadata"
          @input="handleSubmit"
        />
      </input-wrapper>
    </div>
    <div class="row">
      <input-wrapper :title="$t('Mask Duration')">
        <slider-input v-model="durationModel" @input="throttledSubmit" :metadata="{min: 8, max: 60}"/>
      </input-wrapper>
    </div>
    <div class="row">
      <input-wrapper :title="$t('Donation Masks')">
        <toggle-input
          v-model="donationsEnabledModel"
          name="donationsEnabled"
          @input="handleSubmit"
          :metadata="{ title: $t('Enable Face Mask Donations') }"
        />
      </input-wrapper>
    </div>
    <div class="row" v-if="showTwitchFeatures">
      <input-wrapper :title="$t('Subscriber Masks')">
        <toggle-input
          v-model="subsEnabledModel"
          name="subsEnabled"
          @input="handleSubmit"
          :metadata="{ title: $t('Enable Sub Masks') }"
        />
      </input-wrapper>
    </div>
    <div class="row" v-if="showTwitchFeatures">
      <input-wrapper :title="$t('Bits Masks')">
        <toggle-input
          v-model="bitsEnabledModel"
          name="bitsEnabled"
          @input="handleSubmit"
          :metadata="{ title: $t('Enable Bits Masks') }"
        />
      </input-wrapper>
    </div>
    <div class="row last-item" v-if="showTwitchFeatures">
      <input-wrapper :title="$t('Minimum Bits to Activate')">
        <number-input
          v-model="bitsPriceModel"
          @input="handleSubmit"
        />
      </input-wrapper>
    </div>
      <div class="row">
      <input-wrapper :title="$t('Download Progress')">
        <progress-bar :progressComplete="downloadProgress"></progress-bar>
      </input-wrapper>
    </div>
    <div class="row">
      <input-wrapper :title="$t('Test Face Masks')">
        <Accordion :opened-title="$t('Collapse')" :closed-title="$t('Expand')">
          <div slot="content">
            <item-grid>
              <virtual-item
                v-for="(mask) in availableMasks"
                :key="mask.uuid"
                :preview="`http://facemasks-cdn.streamlabs.com/${mask.uuid}.png`"
                :name="mask.name"
                @click="clickMask(mask)"
              ></virtual-item>
            </item-grid>
        </div>
        </Accordion>
      </input-wrapper>
    </div>
  </div>
</template>

<script lang="ts" src="./FacemaskSettings.vue.ts"></script>
<style lang="less" scoped>
  @import '../../../styles/index';

  .row {
    flex-wrap: nowrap;
    width: 100%;
    margin-left: 15px;
    margin-bottom: 16px;
  }

  .extension-warning {
    background-color: var(--accent);
    color: var(--white);
    border-radius: 4px;
    padding: 6px;

    a {
      color: var(--white);
    }
  }

  .last-item {
    margin-bottom: 50px;
  }

  .row > div {
    margin-right: 15px;
  }
</style>
