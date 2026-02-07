import * as THREE from 'three';
import type { CollisionWorld } from '../core/CollisionWorld';
import type { Input } from '../core/Input';
import type { Player } from './Player';

export type MovementState = {
  moving: boolean;
  running: boolean;
  grounded: boolean;
  speed: number;
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
  gravity = 24;
  jumpVelocity = 8.6;

  private readonly velocity = new THREE.Vector3();
  private readonly desiredVelocity = new THREE.Vector3();
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly desiredDirection = new THREE.Vector3();
  private readonly moveDelta = new THREE.Vector3();
  private readonly targetRotation = new THREE.Quaternion();
  private readonly resolvedPosition = new THREE.Vector3();
  private verticalVelocity = 0;
  private grounded = false;

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
    const jumpPressed = this.input.consumePress('Space');
    const groundProbeHeight = this.resolvedPosition.y + PLAYER_STEP_HEIGHT + 1.8;
    const groundY = this.collisionWorld.getGroundHeight(
      this.resolvedPosition.x,
      this.resolvedPosition.z,
      groundProbeHeight,
      PLAYER_STEP_HEIGHT + 4
    );

    if (groundY !== null) {
      const feetToGround = this.resolvedPosition.y - groundY;
      this.grounded = feetToGround <= 0.08 && this.verticalVelocity <= 0;
      if (this.grounded) {
        this.resolvedPosition.y = groundY;
      }
    } else {
      this.grounded = false;
    }

    if (jumpPressed && this.grounded) {
      this.verticalVelocity = this.jumpVelocity;
      this.grounded = false;
    }

    if (!this.grounded) {
      this.verticalVelocity -= this.gravity * deltaSeconds;
      const candidateY = this.resolvedPosition.y + this.verticalVelocity * deltaSeconds;

      if (
        this.verticalVelocity > 0 &&
        this.collisionWorld.capsuleIntersects({
          x: this.resolvedPosition.x,
          z: this.resolvedPosition.z,
          y: candidateY,
          radius: PLAYER_RADIUS,
          height: PLAYER_HEIGHT
        })
      ) {
        this.verticalVelocity = 0;
      } else {
        this.resolvedPosition.y = candidateY;
      }

      const landingProbeY = this.resolvedPosition.y + PLAYER_STEP_HEIGHT + 1.6;
      const landingGroundY = this.collisionWorld.getGroundHeight(
        this.resolvedPosition.x,
        this.resolvedPosition.z,
        landingProbeY,
        PLAYER_STEP_HEIGHT + 4
      );

      if (landingGroundY !== null) {
        const distanceToGround = this.resolvedPosition.y - landingGroundY;
        if (this.verticalVelocity <= 0 && distanceToGround <= 0.12) {
          this.resolvedPosition.y = landingGroundY;
          this.verticalVelocity = 0;
          this.grounded = true;
        }
      }
    } else {
      this.verticalVelocity = 0;
    }

    this.player.object.position.copy(this.resolvedPosition);

    const moving = this.velocity.lengthSq() > 0.07;
    const rotationLerp = 1 - Math.exp(-this.turnSpeed * deltaSeconds);
    this.targetRotation.setFromAxisAngle(UP, yaw);
    this.player.object.quaternion.slerp(this.targetRotation, rotationLerp);

    if (!this.grounded) {
      this.player.setAnimation('idle');
    } else if (!moving) {
      this.player.setAnimation('idle');
    } else if (isRunning) {
      this.player.setAnimation('run');
    } else {
      this.player.setAnimation('walk');
    }

    return {
      moving,
      running: moving && isRunning,
      grounded: this.grounded,
      speed: this.velocity.length()
    };
  }
}
