<template>
  <widget-editor :navItems="navItems">
    <validated-form slot="manage-credits-properties" @input="save()" v-if="loaded">
      <!-- <button class="button button--action" @click="rollCredits">{{ $t('Roll Credits') }}</button> -->
      <v-form-group v-model="wData.settings.credit_title" :metadata="metadata.title" />
      <v-form-group v-model="wData.settings.credit_subtitle" :metadata="metadata.subtitle" />
      <v-form-group :title="$t('Includes')">
        <bool-input :title="$t('Show Donations')" v-model="wData.settings.donations" />
        <bool-input
          v-for="option in optionIterable(shownCreditOptions)"
          :key="option"
          :title="shownCreditOptions[option]"
          v-model="wData.settings[option]"
        />
      </v-form-group>
      <v-form-group :title="$t('Donors')" type="text" v-model="wData.settings.donor_change" />
      <v-form-group
        v-for="option in optionIterable(creditNameOptions)"
        :key="option"
        :title="creditNameOptions[option]"
        type="text"
        v-model="wData.settings[option]"
      />
    </validated-form>

    <validated-form slot="visual-properties" @input="save()" v-if="loaded">
      <v-form-group v-model="wData.settings.theme" :metadata="metadata.theme" />
      <v-form-group
        v-model="wData.settings.background_color"
        :metadata="metadata.backgroundColor"
      />
      <v-form-group v-model="wData.settings.font" :metadata="metadata.fontFamily" />
      <v-form-group v-model="wData.settings.font_size" :metadata="metadata.fontSize" />
      <v-form-group v-model="wData.settings.font_color" :metadata="metadata.fontColor" />

      <v-form-group :title="$t('Loop Option')">
        <bool-input :title="$t('Loop the credits')" v-model="wData.settings.loop_credits" />
      </v-form-group>
      <v-form-group v-model="wData.settings.delay_time" :metadata="metadata.delayTime" />
      <v-form-group v-model="wData.settings.roll_speed" :metadata="metadata.rollSpeed" />
      <v-form-group v-model="wData.settings.roll_time" :metadata="metadata.rollTime" />
    </validated-form>
  </widget-editor>
</template>

<script lang="ts" src="./Credits.vue.ts"></script>
