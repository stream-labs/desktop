// This class is used for building and parsing source frame
// headers to be sent over the TCP socket.


/* Fields:
  * id
  * format
  * width
  * height
  * frameLength
 */

// All fields have the type Uint32, because dealing with different
// field lengths on the same underlying buffer is difficult in JS

class SourceFrameHeader {

  constructor(buffer) {
    this.fields = [
      'id',
      'format',
      'width',
      'height',
      'frameLength'
    ];

    this.length = this.fields.length * 4;
    if (buffer) {
      this.buffer = buffer;
    } else {
      this.buffer = new Uint8Array(this.length);
    }
    this.buffer32 = new Uint32Array(this.buffer.buffer);

    this.fields.forEach((field, index) => {
      Object.defineProperty(this, field, {
        get: () => {
          return this.buffer32[index];
        },
        set: val => {
          this.buffer32[index] = val;
        }
      });
    });
  }
}

export default SourceFrameHeader;
