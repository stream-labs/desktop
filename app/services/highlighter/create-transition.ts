// This code is taken from https://github.com/gre/gl-transition-libs/blob/master/packages/gl-transition/src/index.js
// The original code is MIT licensed.
// Modifications were made to support rendering upside down.
// Modifications were also made to move off stack-gl/gl-shader.
// It was also ported from flow to Typescript

import { compileShader, createProgram } from 'util/webgl/utils';

interface TransitionObjectLike {
  glsl: string;
  defaultParams: { [key: string]: any };
  paramsTypes: { [key: string]: string };
}

interface GLTextureLike {
  bind: (unit: number) => number;
  shape: [number, number];
}

interface Options {
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'flipY';
}

const VERT = `attribute vec2 _p;
varying vec2 _uv;
void main() {
gl_Position = vec4(_p,0.0,1.0);
vec2 uv = vec2(0.5, 0.5) * (_p+vec2(1.0, 1.0));
_uv = vec2(uv.x, 1.0 - uv.y);
}`;

// these functions make a GLSL code that map the texture2D uv to preserve ratio for a given ${r} image ratio.
// there are different modes:
const resizeModes = {
  cover: (r: string) => `.5+(uv-.5)*vec2(min(ratio/${r},1.),min(${r}/ratio,1.))`,
  contain: (r: string) => `.5+(uv-.5)*vec2(max(ratio/${r},1.),max(${r}/ratio,1.))`,
  stretch: () => 'uv',
};

const makeFrag = (transitionGlsl: string, resizeMode: string): string => {
  const r = resizeModes[resizeMode];
  if (!r) throw new Error('invalid resizeMode=' + resizeMode);
  return `\
precision highp float;varying vec2 _uv;uniform sampler2D from, to;uniform float progress, ratio, _fromR, _toR;vec4 getFromColor(vec2 uv){return texture2D(from,${r(
    '_fromR',
  )});}vec4 getToColor(vec2 uv){return texture2D(to,${r('_toR')});}
${transitionGlsl}
void main(){gl_FragColor=transition(_uv);}`;
};

export default function createTransition(
  gl: WebGLRenderingContext,
  transition: TransitionObjectLike,
  options: Options = {},
) {
  const { resizeMode } = { resizeMode: 'cover', ...options };
  const vShader = compileShader(gl, VERT, gl.VERTEX_SHADER);
  const fShader = compileShader(gl, makeFrag(transition.glsl, resizeMode), gl.FRAGMENT_SHADER);
  const program = createProgram(gl, vShader, fShader);

  gl.useProgram(program);
  const positionLocation = gl.getAttribLocation(program, '_p');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  return {
    draw(
      progress: number,
      from: GLTextureLike,
      to: GLTextureLike,
      width: number = gl.drawingBufferWidth,
      height: number = gl.drawingBufferHeight,
      params: { [key: string]: any } = {},
    ) {
      gl.useProgram(program);
      gl.uniform1f(gl.getUniformLocation(program, 'ratio'), width / height);
      gl.uniform1f(gl.getUniformLocation(program, 'progress'), progress);
      gl.uniform1i(gl.getUniformLocation(program, 'from'), from.bind(0));
      gl.uniform1i(gl.getUniformLocation(program, 'to'), to.bind(1));
      gl.uniform1f(gl.getUniformLocation(program, '_fromR'), from.shape[0] / from.shape[1]);
      gl.uniform1f(gl.getUniformLocation(program, '_toR'), to.shape[0] / to.shape[1]);

      let unit = 2;
      for (const key in transition.paramsTypes) {
        const value = key in params ? params[key] : transition.defaultParams[key];
        if (transition.paramsTypes[key] === 'sampler2D') {
          if (!value) {
            console.warn(
              'uniform[' + key + ']: A texture MUST be defined for uniform sampler2D of a texture',
            );
          } else if (typeof value.bind !== 'function') {
            throw new Error('uniform[' + key + ']: A gl-texture2d API-like object was expected');
          } else {
            gl.uniform1i(gl.getUniformLocation(program, key), value.bind(unit++));
          }
        } else {
          gl.uniform1f(gl.getUniformLocation(program, key), value);
        }
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {},
  };
}
