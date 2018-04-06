<template>
<div>
  <div class="flex">
    <div class="fader" @click="showQrcode">
      <qrcode :value="qrcodeVal" :options="{ size: 250 }" :class="{ blur: !qrcodeIsVisible }"></qrcode>
      <span v-if="!qrcodeIsVisible">Click to show</span>
    </div>
    <div class="description">
      You can now control Streamlabs OBS from your mobile phone. <br/>
      To begin, scan this QR code with your phone.
    </div>
  </div>

  <div v-if="qrcodeIsVisible">
    <a href="" @click.prevent="detailsIsVisible = true" v-if="!detailsIsVisible">
      Show details
    </a>
    <a href="" @click.prevent="detailsIsVisible = false" v-if="detailsIsVisible">
      Hide details
    </a>
    <div class="details" v-if="detailsIsVisible">
      API token: {{ qrcodeData.token }} <a href="" @click.prevent="generateToken">Generate new</a><br/>
      Address: {{ qrcodeData.addresses.map(address => address + ':' + qrcodeData.port).join(', ')}}
    </div>
  </div>
</div>
</template>

<script lang="ts" src="./RemoteControlQRCode.vue.ts"></script>

<style lang="less" scoped>
   .remote-control-qr-code {
     display: flex;
   }

   .description {
     padding-left: 10px;
   }

   .fader {
     position: relative;
     overflow: hidden;
     cursor: pointer;
     width: 320px;

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
