<template>
  <div slot="content">
    <div class="row">
      <h-form-group :title="$t('Face Masks Enabled')">
        <toggle-input
          v-model="enabledModel"
          name="enabled"
          @input="handleSubmit"
          :metadata="{ title: $t('Enable Face Masks') }"
        />
      </h-form-group>
    </div>
    <div class="row">
      <h-form-group :title="$t('Video Device')">
        <list-input
          v-model="videoInputModel"
          :metadata="videoInputMetadata"
          @input="handleSubmit"
        />
      </h-form-group>
    </div>
    <div class="row">
      <h-form-group :title="$t('Mask Duration')">
        <slider-input v-model="durationModel" @input="handleSubmit" :metadata="{min: 8, max: 60}"/>
      </h-form-group>
    </div>
    <div class="row">
      <h-form-group :title="$t('Donation Masks')">
        <toggle-input
          v-model="donationsEnabledModel"
          name="donationsEnabled"
          @input="handleSubmit"
          :metadata="{ title: $t('Enable Face Mask Donations') }"
        />
      </h-form-group>
    </div>
    <div class="row" v-if="showTwitchFeatures">
      <h-form-group :title="$t('Subscriber Masks')">
        <toggle-input
          v-model="subsEnabledModel"
          name="subsEnabled"
          @input="handleSubmit"
          :metadata="{ title: $t('Enable Sub Masks') }"
        />
      </h-form-group>
    </div>
    <div class="row" v-if="showTwitchFeatures">
      <h-form-group :title="$t('Bits Masks')">
        <toggle-input
          v-model="bitsEnabledModel"
          name="bitsEnabled"
          @input="handleSubmit"
          :metadata="{ title: $t('Enable Bits Masks') }"
        />
      </h-form-group>
    </div>
    <div class="row last-item" v-if="showTwitchFeatures">
      <h-form-group :title="$t('Minimum Bits to Activate')">
        <number-input
          v-model="bitsPriceModel"
          @input="handleSubmit"
        />
      </h-form-group>
    </div>
      <div class="row">
      <h-form-group :title="$t('Download Progress')">
        <progress-bar :progressComplete="downloadProgress"></progress-bar>
      </h-form-group>
    </div>
    <div class="row">
      <h-form-group :title="$t('Test Face Masks')">
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
      </h-form-group>
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
