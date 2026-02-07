export function createLoop(renderFrame: () => void): {
  start: () => void;
  stop: () => void;
} {
  let frameId = 0;

  const tick = () => {
    renderFrame();
    frameId = requestAnimationFrame(tick);
  };

  return {
    start() {
      if (frameId === 0) {
        tick();
      }
    },
    stop() {
      if (frameId !== 0) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }
  };
}
