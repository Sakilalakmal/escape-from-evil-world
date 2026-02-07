export class Time {
  private lastSeconds = performance.now() * 0.001;
  elapsed = 0;
  delta = 0;

  tick(): number {
    const nowSeconds = performance.now() * 0.001;
    this.delta = Math.min(nowSeconds - this.lastSeconds, 0.1);
    this.elapsed += this.delta;
    this.lastSeconds = nowSeconds;
    return this.delta;
  }
}
