// This class can be used to render a raw RGBA frame using
// WebGL.  This is much less strain on the CPU than the
// normal 2d canvas context.

// Inspired by:
//
// http://jsfiddle.net/XfyX2/1/
// https://github.com/RSATom/webgl-video-renderer

class WebGLRenderer {

  // The HTML canvas element must be passed in
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    let gl = this.gl = this.canvas.getContext('webgl');

    this.texture = gl.createTexture();
    let vbo = gl.createBuffer();
    let program = gl.createProgram();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    // These settings are important to make sure we can support
    // texture sizes that aren't a power of 2.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, 1, 1, 1, 1, -1, 1, -1, -1]),
      gl.STATIC_DRAW
    );

    let vShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(
      vShader,
      "attribute vec4 vertex;\n" +
      "varying vec2 tc;\n" +
      "void main(){\n" +
      " gl_Position = vertex;\n" +
      " tc = vertex.xy*0.5+0.5;\n" +
      "}\n"
    );

    let fShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(
      fShader,
      "precision highp float;\n" +
      "uniform sampler2D tex;\n" +
      "varying vec2 tc;\n" +
      "void main(){\n" +
      " gl_FragColor = texture2D(tex, tc);\n" +
      "}\n"
    );

    gl.compileShader(vShader);
    gl.compileShader(fShader);

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);

    gl.bindAttribLocation(program, 0, "vertex");
    gl.linkProgram(program);
    gl.useProgram(program);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }

  drawFrame(frame) {
    let gl = this.gl;

    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.width,
      this.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      frame
    );

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

}

export default WebGLRenderer;
