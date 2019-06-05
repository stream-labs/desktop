// Adapted from https://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html

/**
 * Creates and compiles a shader.
 *
 * @param gl The WebGL Context.
 * @param shaderSource The GLSL source code for the shader.
 * @param shaderType The type of shader, VERTEX_SHADER or
 *     FRAGMENT_SHADER.
 * @return {!WebGLShader} The shader.
 */
export function compileShader(gl: WebGLRenderingContext, shaderSource: string, shaderType: GLenum) {
  // Create the shader object
  const shader = gl.createShader(shaderType);

  // Set the shader source code.
  gl.shaderSource(shader, shaderSource);

  // Compile the shader
  gl.compileShader(shader);

  // Check if it compiled
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);

  if (!success) {
    // Something went wrong during compilation; get the error
    throw `could not compile shader: ${gl.getShaderInfoLog(shader)}`;
  }

  return shader;
}

/**
 * Creates a program from 2 shaders.
 *
 * @param gl The WebGL Context.
 * @param vertexShader A vertex shader.
 * @param fragmentShader A fragment shader.
 * @return A program.
 */
export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
) {
  // create a program.
  const program = gl.createProgram();

  // attach the shaders.
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  // link the program.
  gl.linkProgram(program);

  // Check if it linked.
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);

  if (!success) {
    // something went wrong with the link
    throw `program filed to link: ${gl.getProgramInfoLog(program)}`;
  }

  return program;
}
