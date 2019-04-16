import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { Subscription } from 'rxjs';
import { AudioSource } from 'services/audio';
import { Inject } from 'util/injector';
import { CustomizationService } from 'services/customization';

// Configuration
const CHANNEL_HEIGHT = 3;
const PADDING_HEIGHT = 2;
const PEAK_WIDTH = 4;
const PEAK_HOLD_CYCLES = 100;
const WARNING_LEVEL = -20;
const DANGER_LEVEL = -9;

// Colors
const GREEN = 'rgba(49,195,162,.6)';
const GREEN_BG = 'rgba(49,195,162,.16)';
const YELLOW = 'rgba(255,205,71,.6)';
const YELLOW_BG = 'rgba(255,205,71,.16)';
const RED = 'rgba(252,62,63,.6)';
const RED_BG = 'rgba(252,62,63,.16)';

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
  colorLocation: WebGLUniformLocation;
  translationLocation: WebGLUniformLocation;
  scaleLocation: WebGLUniformLocation;
  volumeLocation: WebGLUniformLocation;

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

    const vShaderSrc = `
      attribute vec2 a_position;

      uniform vec2 u_resolution;
      uniform vec2 u_translation;
      uniform vec2 u_scale;

      varying vec2 v_displacement;

      void main() {
        // Scale the positon
        vec2 scaledPosition = a_position * u_scale;

        // Add in the translation.
        vec2 position = scaledPosition + u_translation;

        // convert the position from pixels to 0.0 to 1.0
        vec2 zeroToOne = position / u_resolution;

        v_displacement = zeroToOne;

        // convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;

        // convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;

        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;

    const fShaderSrc = `
      precision highp float;

      uniform vec4 u_color;
      uniform float u_volume;

      uniform float u_warning;
      uniform float u_danger;

      varying vec2 v_displacement;

      void main() {
        vec4 mult = vec4(0.3, 0.3, 0.3, 1);

        if (v_displacement.x < u_volume) {
          mult = vec4(1, 1, 1, 1);
        }

        vec4 baseColor;

        if (v_displacement.x > u_danger) {
          baseColor = vec4(0.98, 0.24, 0.24, 1);
        } else if (v_displacement.x > u_warning) {
          baseColor = vec4(1, 0.8, 0.28, 1);
        } else {
          baseColor = vec4(0.19, 0.76, 0.64, 1);
        }

        gl_FragColor = baseColor * mult;
      }
    `;

    this.gl = this.$refs.canvas.getContext('webgl', { alpha: false });

    const vShader = this.compileShader(vShaderSrc, this.gl.VERTEX_SHADER);
    const fShader = this.compileShader(fShaderSrc, this.gl.FRAGMENT_SHADER);
    this.program = this.createProgram(vShader, fShader);

    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);

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
    this.colorLocation = this.gl.getUniformLocation(this.program, 'u_color');
    this.translationLocation = this.gl.getUniformLocation(this.program, 'u_translation');
    this.scaleLocation = this.gl.getUniformLocation(this.program, 'u_scale');
    this.volumeLocation = this.gl.getUniformLocation(this.program, 'u_volume');

    this.gl.useProgram(this.program);

    const warningLocation = this.gl.getUniformLocation(this.program, 'u_warning');
    this.gl.uniform1f(warningLocation, this.dbToUnitScalar(WARNING_LEVEL));

    console.log(this.dbToUnitScalar(DANGER_LEVEL));
    const dangerLocation = this.gl.getUniformLocation(this.program, 'u_danger');
    this.gl.uniform1f(dangerLocation, this.dbToUnitScalar(DANGER_LEVEL));
  }

  /**
   * Creates and compiles a shader.
   *
   * @param {string} shaderSource The GLSL source code for the shader.
   * @param {number} shaderType The type of shader, VERTEX_SHADER or
   *     FRAGMENT_SHADER.
   * @return {!WebGLShader} The shader.
   */
  compileShader(shaderSource: string, shaderType: GLenum) {
    // Create the shader object
    const shader = this.gl.createShader(shaderType);

    // Set the shader source code.
    this.gl.shaderSource(shader, shaderSource);

    // Compile the shader
    this.gl.compileShader(shader);

    // Check if it compiled
    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);

    if (!success) {
      // Something went wrong during compilation; get the error
      throw `could not compile shader: ${this.gl.getShaderInfoLog(shader)}`;
    }

    return shader;
  }

  /**
   * Creates a program from 2 shaders.
   *
   * @param {!WebGLShader} vertexShader A vertex shader.
   * @param {!WebGLShader} fragmentShader A fragment shader.
   * @return {!WebGLProgram} A program.
   */
  createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    // create a program.
    const program = this.gl.createProgram();

    // attach the shaders.
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);

    // link the program.
    this.gl.linkProgram(program);

    // Check if it linked.
    const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);

    if (!success) {
      // something went wrong with the link
      throw `program filed to link: ${this.gl.getProgramInfoLog(program)}`;
    }

    return program;
  }

  get backgroundColor() {
    return this.customizationService.themeBackground;
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
    // this.ctx.fillStyle = this.backgroundColor;
    // this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
    // peaks.forEach((peak, channel) => {
    //   this.drawVolmeterChannel(peak, channel);
    // });

    // console.log(peaks[0]);

    this.gl.viewport(0, 0, this.$refs.canvas.width, this.$refs.canvas.height);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Set uniforms
    this.gl.uniform2f(this.resolutionLocation, 1, this.canvasHeight);
    this.gl.uniform4f(this.colorLocation, 0.5, 0.5, 1.0, 1.0);

    peaks.forEach((peak, channel) => {
      this.drawVolmeterChannel(peak, channel);
    });
  }

  drawVolmeterChannel(peak: number, channel: number) {
    const normalVol = Math.max((peak + 60) * (1 / 60), 0);
    this.gl.uniform2f(this.scaleLocation, 1, CHANNEL_HEIGHT);
    this.gl.uniform2f(this.translationLocation, 0, channel * (CHANNEL_HEIGHT + PADDING_HEIGHT));
    this.gl.uniform1f(this.volumeLocation, normalVol);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // this.updatePeakHold(peak, channel);
    // const heightOffset = channel * (CHANNEL_HEIGHT + PADDING_HEIGHT);
    // const warningPx = this.dbToPx(WARNING_LEVEL);
    // const dangerPx = this.dbToPx(DANGER_LEVEL);
    // this.ctx.fillStyle = GREEN_BG;
    // this.ctx.fillRect(0, heightOffset, warningPx, CHANNEL_HEIGHT);
    // this.ctx.fillStyle = YELLOW_BG;
    // this.ctx.fillRect(warningPx, heightOffset, dangerPx - warningPx, CHANNEL_HEIGHT);
    // this.ctx.fillStyle = RED_BG;
    // this.ctx.fillRect(dangerPx, heightOffset, this.canvasWidth - dangerPx, CHANNEL_HEIGHT);
    // const peakPx = this.dbToPx(peak);
    // const greenLevel = Math.min(peakPx, warningPx);
    // this.ctx.fillStyle = GREEN;
    // this.ctx.fillRect(0, heightOffset, greenLevel, CHANNEL_HEIGHT);
    // if (peak > WARNING_LEVEL) {
    //   const yellowLevel = Math.min(peakPx, dangerPx);
    //   this.ctx.fillStyle = YELLOW;
    //   this.ctx.fillRect(warningPx, heightOffset, yellowLevel - warningPx, CHANNEL_HEIGHT);
    // }
    // if (peak > DANGER_LEVEL) {
    //   this.ctx.fillStyle = RED;
    //   this.ctx.fillRect(dangerPx, heightOffset, peakPx - dangerPx, CHANNEL_HEIGHT);
    // }
    // this.ctx.fillStyle = GREEN;
    // if (this.peakHolds[channel] > WARNING_LEVEL) this.ctx.fillStyle = YELLOW;
    // if (this.peakHolds[channel] > DANGER_LEVEL) this.ctx.fillStyle = RED;
    // this.ctx.fillRect(
    //   this.dbToPx(this.peakHolds[channel]) - PEAK_WIDTH / 2,
    //   heightOffset,
    //   PEAK_WIDTH,
    //   CHANNEL_HEIGHT,
    // );
  }

  dbToUnitScalar(db: number) {
    return (db + 60) * (1 / 60);
  }

  dbToPx(db: number) {
    return Math.round((db + 60) * (this.canvasWidth / 60));
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
