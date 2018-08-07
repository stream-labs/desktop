<template>
<div class="section">
  <div class="section-content">
    <div class="input-container">
      <div class="fader" @click="showQrcode">
        <qrcode :value="qrcodeVal" :options="{ size: 250 }" :class="{ blur: !qrcodeIsVisible }"></qrcode>
        <span v-if="!qrcodeIsVisible">{{ $t('Click to show')}}</span>
      </div>

      <div v-if="qrcodeIsVisible">
        <a href="" @click.prevent="detailsIsVisible = true" v-if="!detailsIsVisible">
          {{ $t('Show details') }}
        </a>
        <a href="" @click.prevent="detailsIsVisible = false" v-if="detailsIsVisible">
          {{ $t('Hide details') }}
        </a>
        <div class="details" v-if="detailsIsVisible">
          <label>
            {{ $t('API token') }} <br/>
            <input type="text" readonly :value="qrcodeData.token">
            <a href="" @click.prevent="generateToken">{{ $t('Generate new') }}</a><br/>
            <br/>
          </label>
          <label>
            {{ $t('Port') }}<br/>
            <input type="text" readonly :value="qrcodeData.port">
          </label>
          <label>
            {{ $t('IP addresses') }}<br/>
            <input type="text" readonly :value="qrcodeData.addresses.join(', ')">
          </label>
        </div>
      </div>
    </div>

    <div class="input-container">
      <div>
        {{ $t('You can now control Streamlabs OBS from your phone.') }} <br/>
        {{ $t('To begin, Scan this QR code with your phone.') }}<br/>
        {{ $t('This feature will only work with the most recent version of the Streamlabs mobile app.') }}<br/>
      </div>
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./RemoteControlQRCode.vue.ts"></script>

<style lang="less" scoped>
@import "../styles/index";

input {
  cursor: text;
}

.fader {
 position: relative;
 overflow: hidden;
 cursor: pointer;


 span {
   position: absolute;
   top: 100px;
   left: 70px;
   display: block;
   color: white;
   font-size: 16px;
   background: rgba(0,0,0,0.7);
   padding: 10px;
   box-shadow: 0 0 10px 6px rgba(0,0,0,0.7);
 }
}

.blur {
  filter: blur(5px);
}
</style>
