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
      'width',
      'height',
      'frameLength'
    ];

    this.length = this.fields.length * 4;

    this.fields.forEach((field, index) => {
      Object.defineProperty(this, field, {
        get: () => {
          return (new Uint32Array(this.buffer.buffer))[index];
        },
        set: val => {
          (new Uint32Array(this.buffer.buffer))[index] = val;
        }
      });
    });

    if (buffer) {
      this.buffer = buffer;
    } else {
      this.buffer = new Uint8Array(this.length);
    }
  }

}

module.exports.default = SourceFrameHeader;
