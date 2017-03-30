// Class for Source Frames

class SourceFrame {
  static fields() {
    return [
      'id',
      'width',
      'height',
      'format',
      'size',
      'front_offset',    // Front Buffer (Renderer)
      'back_offset'      // Back Buffer (Main Process)
    ];
  }
  static getHeaderSize() {
    return SourceFrame.fields().length * 4; // Uint32
  }
  static getFullSize(frameSize) {
    return SourceFrame.getHeaderSize() + frameSize * 2; // Front + Back Buffer
  }

  constructor(p_ArrayBuffer, p_frameSize) {
    this.buffer = p_ArrayBuffer;
    this.fieldBuffer = new Uint32Array(this.buffer);
    this.length = this.buffer.byteLength;

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
    
    if (p_frameSize !== undefined) {
      this.size = p_frameSize;
      this.front_offset = SourceFrame.getHeaderSize();
      this.back_offset = SourceFrame.getHeaderSize() + this.size;
    }
  }

  front_buffer() {
    return new Uint8Array(this.buffer, this.front_offset, this.size);
  }
  back_buffer() {
    return new Uint8Array(this.buffer, this.back_offset, this.size);
  }
  flip() {
    this.front_offset, this.back_offset = this.back_offset, this.front_offset;
  }
}

export default SourceFrame;