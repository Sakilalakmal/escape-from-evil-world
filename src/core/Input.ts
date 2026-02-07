export type MovementAxes = {
  x: number;
  z: number;
};

export class Input {
  private readonly keysDown = new Set<string>();
  private readonly keysPressed = new Set<string>();

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.code === 'Space' || event.code === 'Tab') {
      event.preventDefault();
    }

    if (!this.keysDown.has(event.code)) {
      this.keysPressed.add(event.code);
    }
    this.keysDown.add(event.code);
  };

  private readonly onKeyUp = (event: KeyboardEvent): void => {
    if (event.code === 'Space' || event.code === 'Tab') {
      event.preventDefault();
    }

    this.keysDown.delete(event.code);
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  isDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  consumePress(code: string): boolean {
    if (!this.keysPressed.has(code)) {
      return false;
    }

    this.keysPressed.delete(code);
    return true;
  }

  getMovementAxes(): MovementAxes {
    const left = this.isDown('KeyA') ? 1 : 0;
    const right = this.isDown('KeyD') ? 1 : 0;
    const forward = this.isDown('KeyW') ? 1 : 0;
    const backward = this.isDown('KeyS') ? 1 : 0;

    return {
      x: right - left,
      z: forward - backward
    };
  }

  clearPressed(): void {
    this.keysPressed.clear();
  }

  dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.keysDown.clear();
    this.keysPressed.clear();
  }
}
