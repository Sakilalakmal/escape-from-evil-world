import * as THREE from 'three';

type LockChangeHandler = (locked: boolean) => void;

const MIN_PITCH = THREE.MathUtils.degToRad(-60);
const MAX_PITCH = THREE.MathUtils.degToRad(35);

export class PointerLock {
  yaw = Math.PI;
  pitch = THREE.MathUtils.degToRad(-8);

  private targetYaw = this.yaw;
  private targetPitch = this.pitch;
  private enabled = true;
  private locked = false;

  private readonly lockListeners = new Set<LockChangeHandler>();

  private readonly sensitivity = 0.0025;
  private readonly smoothness = 14;

  private readonly onMouseMove = (event: MouseEvent): void => {
    if (!this.enabled || !this.locked) {
      return;
    }

    this.targetYaw -= event.movementX * this.sensitivity;
    this.targetPitch = THREE.MathUtils.clamp(
      this.targetPitch - event.movementY * this.sensitivity,
      MIN_PITCH,
      MAX_PITCH
    );
  };

  private readonly onPointerLockChange = (): void => {
    this.locked = document.pointerLockElement === this.domElement;
    this.emitLockChange();
  };

  constructor(private readonly domElement: HTMLElement) {
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  requestLock(): void {
    if (!this.enabled || this.locked) {
      return;
    }

    this.domElement.requestPointerLock();
  }

  exitLock(): void {
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.exitLock();
    }
  }

  setAngles(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = THREE.MathUtils.clamp(pitch, MIN_PITCH, MAX_PITCH);
    this.targetYaw = this.yaw;
    this.targetPitch = this.pitch;
  }

  update(deltaSeconds: number): void {
    const t = 1 - Math.exp(-this.smoothness * deltaSeconds);
    this.yaw = THREE.MathUtils.lerp(this.yaw, this.targetYaw, t);
    this.pitch = THREE.MathUtils.lerp(this.pitch, this.targetPitch, t);
  }

  isLocked(): boolean {
    return this.locked;
  }

  onLockChange(handler: LockChangeHandler): () => void {
    this.lockListeners.add(handler);
    handler(this.locked);

    return () => {
      this.lockListeners.delete(handler);
    };
  }

  dispose(): void {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    this.lockListeners.clear();
  }

  private emitLockChange(): void {
    for (const listener of this.lockListeners) {
      listener(this.locked);
    }
  }
}
