// Class for Source Frames

class SourceFrame {
  static fields() {
    return [
      'id',
      'width',
      'height',
      'format',
      'size',
      'frontOffset',    // Front Buffer (Renderer)
      'backOffset'      // Back Buffer (Main Process)
    ];
  }
  static getHeaderSize() {
    return SourceFrame.fields().length * 4; // Uint32
  }
  static getFullSize(frameSize) {
    return SourceFrame.getHeaderSize() + frameSize * 2; // Front + Back Buffer
  }

  constructor(arrayBuffer, frameSize) {
    this.buffer = arrayBuffer;
    this.length = this.buffer.byteLength;
    this.fieldBuffer = new Uint32Array(this.buffer);

    SourceFrame.fields().forEach((field, index) => {
      Object.defineProperty(this, field, {
        get: () => {
          return this.fieldBuffer[index];
        },
        set: val => {
          this.fieldBuffer[index] = val;
        }
      });
    });
    
    if (frameSize !== undefined) {
      this.size = frameSize;
      this.frontOffset = SourceFrame.getHeaderSize();
      this.backOffset = SourceFrame.getHeaderSize() + this.size;
    }
  }

  frontBuffer() {
    return new Uint8Array(this.buffer, this.frontOffset, this.size);
  }
  backBuffer() {
    return new Uint8Array(this.buffer, this.backOffset, this.size);
  }
  flip() {
    let backOffset = this.backOffset;
    this.backOffset = this.frontOffset;
    this.frontOffset = backOffset;
  }
}

export default SourceFrame;