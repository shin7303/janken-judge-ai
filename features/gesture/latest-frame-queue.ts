export type DisposableFrame = { bitmap: { close: () => void } };

export class LatestFrameQueue<T extends DisposableFrame> {
  private busy = false;
  private disposed = false;
  private pending: T | null = null;

  constructor(private readonly send: (frame: T) => void) {}

  submit(frame: T) {
    if (this.disposed) {
      frame.bitmap.close();
      return;
    }
    if (this.busy) {
      this.pending?.bitmap.close();
      this.pending = frame;
      return;
    }
    this.busy = true;
    this.send(frame);
  }

  complete() {
    if (this.disposed) return;
    this.busy = false;
    if (!this.pending) return;
    const latest = this.pending;
    this.pending = null;
    this.submit(latest);
  }

  dispose() {
    this.disposed = true;
    this.pending?.bitmap.close();
    this.pending = null;
  }
}
