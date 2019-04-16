precision mediump float;

uniform vec4 u_color;
uniform float u_volume;
uniform vec2 u_peakHold;

uniform float u_warning;
uniform float u_danger;

// Colors
uniform vec3 u_green;
uniform vec3 u_yellow;
uniform vec3 u_red;

varying vec2 v_displacement;

void main() {
  vec4 mult = vec4(0.3, 0.3, 0.3, 1);

  if (v_displacement.x < u_volume) {
    mult = vec4(1, 1, 1, 1);
  } else if ((v_displacement.x > u_peakHold.x) && (v_displacement.x < u_peakHold.x + u_peakHold.y)) {
    mult = vec4(1, 1, 1, 1);
  }

  vec4 baseColor;

  if (v_displacement.x > u_danger) {
    baseColor = vec4(u_red, 1);
  } else if (v_displacement.x > u_warning) {
    baseColor = vec4(u_yellow, 1);
  } else {
    baseColor = vec4(u_green, 1);
  }

  gl_FragColor = baseColor * mult;
}
