import * as THREE from 'three';
import type { CollisionWorld } from '../core/CollisionWorld';
import type { Input } from '../core/Input';
import type { Player } from './Player';

export type MovementState = {
  moving: boolean;
  running: boolean;
};

const PLAYER_RADIUS = 0.44;
const PLAYER_HEIGHT = 1.9;
const PLAYER_STEP_HEIGHT = 0.48;

const UP = new THREE.Vector3(0, 1, 0);

export class CharacterController {
  speedWalk = 3.8;
  speedRun = 7.2;
  acceleration = 14;
  turnSpeed = 12;

  private readonly velocity = new THREE.Vector3();
  private readonly desiredVelocity = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly desiredDirection = new THREE.Vector3();
  private readonly moveDelta = new THREE.Vector3();
  private readonly targetRotation = new THREE.Quaternion();
  private readonly resolvedPosition = new THREE.Vector3();

  constructor(
    private readonly player: Player,
    private readonly input: Input,
    private readonly collisionWorld: CollisionWorld,
    private readonly getYaw: () => number
  ) {}

  update(deltaSeconds: number): MovementState {
    const axes = this.input.getMovementAxes();
    const hasInput = axes.x !== 0 || axes.z !== 0;
    const isRunning =
      hasInput && (this.input.isDown('ShiftLeft') || this.input.isDown('ShiftRight'));

    const yaw = this.getYaw();
    this.forward.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    this.right.set(this.forward.z, 0, -this.forward.x).normalize();

    this.desiredDirection
      .copy(this.forward)
      .multiplyScalar(axes.z)
      .addScaledVector(this.right, axes.x);

    if (this.desiredDirection.lengthSq() > 1) {
      this.desiredDirection.normalize();
    }

    const targetSpeed = hasInput ? (isRunning ? this.speedRun : this.speedWalk) : 0;
    this.desiredVelocity.copy(this.desiredDirection).multiplyScalar(targetSpeed);

    const velocityLerp = 1 - Math.exp(-this.acceleration * deltaSeconds);
    this.velocity.lerp(this.desiredVelocity, velocityLerp);
    this.moveDelta.copy(this.velocity).multiplyScalar(deltaSeconds);

    const collision = this.collisionWorld.resolveMovement({
      position: this.player.object.position,
      delta: this.moveDelta,
      radius: PLAYER_RADIUS,
      height: PLAYER_HEIGHT,
      stepHeight: PLAYER_STEP_HEIGHT
    });

    this.resolvedPosition.copy(collision.position);
    if (!collision.grounded) {
      this.resolvedPosition.y = Math.max(0, this.resolvedPosition.y - deltaSeconds * 5.5);
    }
    this.player.object.position.copy(this.resolvedPosition);

    const moving = this.velocity.lengthSq() > 0.07;

    if (moving) {
      const heading = Math.atan2(this.desiredDirection.x, this.desiredDirection.z);
      this.targetRotation.setFromAxisAngle(UP, heading);
      const rotationLerp = 1 - Math.exp(-this.turnSpeed * deltaSeconds);
      this.player.object.quaternion.slerp(this.targetRotation, rotationLerp);
    }

    if (!moving) {
      this.player.setAnimation('idle');
    } else if (isRunning) {
      this.player.setAnimation('run');
    } else {
      this.player.setAnimation('walk');
    }

    return { moving, running: moving && isRunning };
  }
}
