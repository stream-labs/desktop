import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Subscription } from 'rxjs';
import { AudioSource } from 'services/audio';
import { Inject } from 'util/injector';
import { CustomizationService } from 'services/customization';
import { compileShader, createProgram } from 'util/webgl/utils';
import vShaderSrc from 'util/webgl/shaders/volmeter.vert';
import fShaderSrc from 'util/webgl/shaders/volmeter.frag';

// Configuration
const CHANNEL_HEIGHT = 3;
const PADDING_HEIGHT = 2;
const PEAK_WIDTH = 4;
const PEAK_HOLD_CYCLES = 100;
const WARNING_LEVEL = -20;
const DANGER_LEVEL = -9;

// Colors (RGB)
const GREEN = [49, 195, 162];
const YELLOW = [255, 205, 71];
const RED = [252, 62, 63];

@Component({})
export default class MixerVolmeter extends Vue {
  @Prop() audioSource: AudioSource;

  @Inject() customizationService: CustomizationService;

  volmeterSubscription: Subscription;

  $refs: {
    canvas: HTMLCanvasElement;
    spacer: HTMLDivElement;
  };

  gl: WebGLRenderingContext;
  program: WebGLProgram;

  // GL Attribute locations
  positionLocation: number;

  // GL Uniform locations
  resolutionLocation: WebGLUniformLocation;
  translationLocation: WebGLUniformLocation;
  scaleLocation: WebGLUniformLocation;
  volumeLocation: WebGLUniformLocation;
  peakHoldLocation: WebGLUniformLocation;
  bgMultiplierLocation: WebGLUniformLocation;

  peakHoldCounters: number[];
  peakHolds: number[];
  canvasWidth: number;
  canvasWidthInterval: number;
  channelCount: number;
  canvasHeight: number;

  mounted() {
    this.subscribeVolmeter();
    this.peakHoldCounters = [];
    this.peakHolds = [];
    this.setChannelCount(1);
    this.canvasWidthInterval = window.setInterval(() => this.setCanvasWidth(), 500);

    this.gl = this.$refs.canvas.getContext('webgl', { alpha: false });

    const vShader = compileShader(this.gl, vShaderSrc, this.gl.VERTEX_SHADER);
    const fShader = compileShader(this.gl, fShaderSrc, this.gl.FRAGMENT_SHADER);
    this.program = createProgram(this.gl, vShader, fShader);

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

    // Vertex geometry for a unit square
    // tslint:disable-next-line
    const positions = [
      0, 0,
      0, 1,
      1, 0,
      1, 0,
      0, 1,
      1, 1,
    ];

    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);

    // look up where the vertex data needs to go.
    this.positionLocation = this.gl.getAttribLocation(this.program, 'a_position');

    // lookup uniforms
    this.resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.translationLocation = this.gl.getUniformLocation(this.program, 'u_translation');
    this.scaleLocation = this.gl.getUniformLocation(this.program, 'u_scale');
    this.volumeLocation = this.gl.getUniformLocation(this.program, 'u_volume');
    this.peakHoldLocation = this.gl.getUniformLocation(this.program, 'u_peakHold');
    this.bgMultiplierLocation = this.gl.getUniformLocation(this.program, 'u_bgMultiplier');

    this.gl.useProgram(this.program);

    const warningLocation = this.gl.getUniformLocation(this.program, 'u_warning');
    this.gl.uniform1f(warningLocation, this.dbToUnitScalar(WARNING_LEVEL));

    const dangerLocation = this.gl.getUniformLocation(this.program, 'u_danger');
    this.gl.uniform1f(dangerLocation, this.dbToUnitScalar(DANGER_LEVEL));

    // Set colors
    this.setColorUniform('u_green', GREEN);
    this.setColorUniform('u_yellow', YELLOW);
    this.setColorUniform('u_red', RED);
  }

  private setColorUniform(uniform: string, color: number[]) {
    const location = this.gl.getUniformLocation(this.program, uniform);
    this.gl.uniform3fv(location, color.map(c => c / 255));
  }

  destroyed() {
    clearInterval(this.canvasWidthInterval);
    this.unsubscribeVolmeter();
  }

  setChannelCount(channels: number) {
    if (channels !== this.channelCount) {
      this.channelCount = channels;
      this.canvasHeight = channels * (CHANNEL_HEIGHT + PADDING_HEIGHT) - PADDING_HEIGHT;
      this.$refs.canvas.height = this.canvasHeight;
      this.$refs.canvas.style.height = `${this.canvasHeight}px`;
      this.$refs.spacer.style.height = `${this.canvasHeight}px`;
    }
  }

  setCanvasWidth() {
    const width = Math.floor(this.$refs.canvas.parentElement.offsetWidth);

    if (width !== this.canvasWidth) {
      this.canvasWidth = width;
      this.$refs.canvas.width = width;
      this.$refs.canvas.style.width = `${width}px`;
    }
  }

  drawVolmeter(peaks: number[]) {
    this.gl.viewport(0, 0, this.$refs.canvas.width, this.$refs.canvas.height);

    const bg = this.customizationService.themeBackground;

    this.gl.clearColor(bg.r / 255, bg.g / 255, bg.b / 255, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Set uniforms
    this.gl.uniform2f(this.resolutionLocation, 1, this.canvasHeight);

    // Volmeter backgrounds appear brighter against a darker background
    this.gl.uniform1f(this.bgMultiplierLocation, this.customizationService.isDarkTheme ? 0.2 : 0.5);

    peaks.forEach((peak, channel) => {
      this.drawVolmeterChannel(peak, channel);
    });
  }

  drawVolmeterChannel(peak: number, channel: number) {
    this.updatePeakHold(peak, channel);

    this.gl.uniform2f(this.scaleLocation, 1, CHANNEL_HEIGHT);
    this.gl.uniform2f(this.translationLocation, 0, channel * (CHANNEL_HEIGHT + PADDING_HEIGHT));
    this.gl.uniform1f(this.volumeLocation, this.dbToUnitScalar(peak));

    // X component is the location of peak hold from 0 to 1
    // Y component is width of the peak hold from 0 to 1
    this.gl.uniform2f(
      this.peakHoldLocation,
      this.dbToUnitScalar(this.peakHolds[channel]),
      PEAK_WIDTH / this.canvasWidth,
    );

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  dbToUnitScalar(db: number) {
    return Math.max((db + 60) * (1 / 60), 0);
  }

  updatePeakHold(peak: number, channel: number) {
    if (!this.peakHoldCounters[channel] || peak > this.peakHolds[channel]) {
      this.peakHolds[channel] = peak;
      this.peakHoldCounters[channel] = PEAK_HOLD_CYCLES;
      return;
    }

    this.peakHoldCounters[channel] -= 1;
  }

  subscribeVolmeter() {
    this.volmeterSubscription = this.audioSource.subscribeVolmeter(volmeter => {
      this.setChannelCount(volmeter.peak.length);
      this.drawVolmeter(volmeter.peak);
    });
  }

  unsubscribeVolmeter() {
    this.volmeterSubscription && this.volmeterSubscription.unsubscribe();
  }
}
