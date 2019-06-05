precision mediump float;

// Current volume level from 0 to 1
uniform float u_volume;

// Current peak hold level:
// x: Volume level from 0 to 1
// y: Indicator width from 0 to 1
uniform vec2 u_peakHold;

// Minimum thresholds from 0 to 1
uniform float u_warning;
uniform float u_danger;

// Colors
uniform vec3 u_green;
uniform vec3 u_yellow;
uniform vec3 u_red;

// Brightness multiplier of the background color
uniform float u_bgMultiplier;

// Position of the current pixel from 0 to 1
varying vec2 v_position;

void main() {
  // Default brightness is dark
  vec4 mult = vec4(u_bgMultiplier, u_bgMultiplier, u_bgMultiplier, 1);

  // If the current position is less than the volume, or is within
  // the peak hold band, then it will be bright.
  if (
    (v_position.x < u_volume) ||
    ((v_position.x > u_peakHold.x) && (v_position.x < u_peakHold.x + u_peakHold.y) && u_peakHold.x != 0.0)
  ) {
    mult = vec4(1, 1, 1, 1);
  }

  vec4 baseColor;

  // Set the color based on which band this pixel is in
  if (v_position.x > u_danger) {
    baseColor = vec4(u_red, 1);
  } else if (v_position.x > u_warning) {
    baseColor = vec4(u_yellow, 1);
  } else {
    baseColor = vec4(u_green, 1);
  }

  gl_FragColor = baseColor * mult;
}
