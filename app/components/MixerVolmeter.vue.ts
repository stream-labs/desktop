import { Component } from 'vue-property-decorator';
import { AudioSource } from 'services/audio';
import TsxComponent, { createProps } from './tsx-component';
import { Volmeter2d } from 'services/audio/volmeter-2d';

class MixerVolmeterProps {
  audioSource: AudioSource = null;
  volmetersEnabled = true;
}

/**
 * Render volmeters on canvas
 * To render multiple volmeters use more optimized Volmeters.tsx instead
 */
@Component({ props: createProps(MixerVolmeterProps) })
export default class MixerVolmeter extends TsxComponent<MixerVolmeterProps> {
  $refs: {
    canvas: HTMLCanvasElement;
    spacer: HTMLDivElement;
  };

  renderingInitialized = false;

  volmeterRenderer: Volmeter2d;

  mounted() {
    this.volmeterRenderer = new Volmeter2d(
      this.props.audioSource,
      this.$refs.canvas,
      this.$refs.spacer,
      () => (this.renderingInitialized = true),
      this.props.volmetersEnabled,
    );
  }

  destroy() {
    if (this.volmeterRenderer) this.volmeterRenderer.destroy();
  }
}
