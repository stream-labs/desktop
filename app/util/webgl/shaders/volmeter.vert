attribute vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_scale;

varying vec2 v_position;

void main() {
  // Get the position in unit space
  vec2 position = (a_position * u_scale + u_translation) / u_resolution;

  // Use this position in the fragment shader
  v_position = position;

  // Convert to clip space
  vec2 clipSpace = position * 2.0 - 1.0;

  // Invert y axis, and convert to vec4
  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
