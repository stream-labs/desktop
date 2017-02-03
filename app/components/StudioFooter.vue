<template>
<div class="studioFooter">
  <div>
    CPU STATS GO HERE
  </div>
  <div class="studioFooter-buttons text-right">
    <button class="button button--default button--md studioFooter-button studioFooter-button--startRecording">
      Start Recording
    </button>
    <button class="button button--default button--md studioFooter-button studioFooter-button--startStreaming">
      Start Streaming
    </button>
  </div>
</div>
</template>

<script>
export default {};
</script>

<style lang="less" scoped>
.studioFooter {
  display: flex;
  flex-direction: row;
  align-items: center;

  padding: 0 40px;

  background-color: #fafafa;
  border-top: 1px solid #ddd;
}

.studioFooter-buttons {
  flex-grow: 1;
}

.studioFooter-button {
  width: 170px;
  margin: 10px 5px;
}

/* Button styles have to be overridden with !important */
.studioFooter-button--startRecording {
  color: #ff4141 !important;
}

.studioFooter-button--startStreaming {
  color: #644899 !important;
}
</style>
