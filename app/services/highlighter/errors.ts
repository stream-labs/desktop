export abstract class HighlighterError extends Error {
  abstract get userMessage(): string;
}

export class FrameWriteError extends HighlighterError {
  get userMessage() {
    return 'An error occurred while writing the video file';
  }
}

export class FrameReadError extends HighlighterError {
  constructor(private file: string) {
    super();
  }

  get userMessage() {
    return `An error occurred while reading ${this.file}`;
  }
}

export class AudioReadError extends HighlighterError {
  constructor(private file: string) {
    super();
  }

  get userMessage() {
    return `An error occurred while reading audio from ${this.file}`;
  }
}

export class AudioMixError extends HighlighterError {
  get userMessage() {
    return 'An error occurred while mixing audio';
  }
}
