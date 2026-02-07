import * as THREE from 'three';
import type { Input } from '../core/Input';
import type { Player } from './Player';

export type MovementState = {
  moving: boolean;
  running: boolean;
};

const UP = new THREE.Vector3(0, 1, 0);

export class CharacterController {
  speedWalk = 3.4;
  speedRun = 6.7;
  acceleration = 14;
  turnSpeed = 12;

  private readonly velocity = new THREE.Vector3();
  private readonly desiredVelocity = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly desiredDirection = new THREE.Vector3();
  private readonly targetRotation = new THREE.Quaternion();

  constructor(
    private readonly player: Player,
    private readonly input: Input,
    private readonly referenceCamera: THREE.Camera
  ) {}

  update(deltaSeconds: number): MovementState {
    const axes = this.input.getMovementAxes();
    const hasInput = axes.x !== 0 || axes.z !== 0;
    const isRunningKeyDown =
      this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight');

    this.referenceCamera.getWorldDirection(this.forward);
    this.forward.y = 0;

    if (this.forward.lengthSq() < 1e-6) {
      this.forward.set(0, 0, 1);
    } else {
      this.forward.normalize();
    }

    this.right.crossVectors(this.forward, UP).normalize();

    this.desiredDirection
      .copy(this.forward)
      .multiplyScalar(axes.z)
      .addScaledVector(this.right, axes.x);

    if (this.desiredDirection.lengthSq() > 1) {
      this.desiredDirection.normalize();
    }

    const targetSpeed = hasInput
      ? isRunningKeyDown
        ? this.speedRun
        : this.speedWalk
      : 0;

    this.desiredVelocity.copy(this.desiredDirection).multiplyScalar(targetSpeed);

    const velocityLerp = 1 - Math.exp(-this.acceleration * deltaSeconds);
    this.velocity.lerp(this.desiredVelocity, velocityLerp);

    this.player.object.position.addScaledVector(this.velocity, deltaSeconds);
    this.player.object.position.y = 0;

    const speed = this.velocity.length();
    const moving = speed > 0.15;
    const running = moving && isRunningKeyDown;

    if (moving) {
      const targetYaw = Math.atan2(this.desiredDirection.x, this.desiredDirection.z);
      this.targetRotation.setFromAxisAngle(UP, targetYaw);

      const rotationLerp = 1 - Math.exp(-this.turnSpeed * deltaSeconds);
      this.player.object.quaternion.slerp(this.targetRotation, rotationLerp);
    }

    if (!moving) {
      this.player.setAnimation('idle');
    } else if (running) {
      this.player.setAnimation('run');
    } else {
      this.player.setAnimation('walk');
    }

    return { moving, running };
  }
}
