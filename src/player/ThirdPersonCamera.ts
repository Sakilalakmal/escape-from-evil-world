import * as THREE from 'three';
import type { CollisionWorld } from '../core/CollisionWorld';
import type { MovementState } from './CharacterController';

const LOOK_DISTANCE = 10;
const FOLLOW_DISTANCE = 6.8;
const FOLLOW_HEIGHT = 2.9;
const LOOK_HEIGHT = 1.65;
const CAMERA_COLLISION_PADDING = 0.22;

export class ThirdPersonCamera {
  private readonly targetPosition = new THREE.Vector3();
  private readonly desiredPosition = new THREE.Vector3();
  private readonly desiredLookAt = new THREE.Vector3();
  private readonly lookAtPoint = new THREE.Vector3();
  private readonly lookDirection = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly safeCameraPosition = new THREE.Vector3();

  private yaw = Math.PI;
  private pitch = THREE.MathUtils.degToRad(-8);
  private bobTime = 0;
  private bobOffset = 0;
  private bobBlend = 0;

  private readonly followSharpness = 10;
  private readonly lookSharpness = 12;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly target: THREE.Object3D,
    private readonly collisionWorld: CollisionWorld
  ) {}

  setLookAngles(yaw: number, pitch: number): void {
    this.yaw = yaw;
    this.pitch = pitch;
  }

  snap(): void {
    this.computeDesiredTransforms();
    this.camera.position.copy(this.desiredPosition);
    this.lookAtPoint.copy(this.desiredLookAt);
    this.camera.lookAt(this.lookAtPoint);
  }

  update(deltaSeconds: number, movement: MovementState): void {
    this.updateBobbing(deltaSeconds, movement);
    this.computeDesiredTransforms();
    this.desiredPosition.y += this.bobOffset;
    this.desiredLookAt.y += this.bobOffset * 0.45;

    const followT = 1 - Math.exp(-this.followSharpness * deltaSeconds);
    this.camera.position.lerp(this.desiredPosition, followT);

    const lookT = 1 - Math.exp(-this.lookSharpness * deltaSeconds);
    this.lookAtPoint.lerp(this.desiredLookAt, lookT);
    this.camera.lookAt(this.lookAtPoint);
  }

  private computeDesiredTransforms(): void {
    const cosPitch = Math.cos(this.pitch);

    this.lookDirection.set(
      Math.sin(this.yaw) * cosPitch,
      Math.sin(this.pitch),
      Math.cos(this.yaw) * cosPitch
    );

    this.target.getWorldPosition(this.targetPosition);
    this.targetPosition.y += LOOK_HEIGHT;

    this.desiredLookAt
      .copy(this.targetPosition)
      .addScaledVector(this.lookDirection, LOOK_DISTANCE);

    this.safeCameraPosition
      .copy(this.targetPosition)
      .addScaledVector(this.lookDirection, -FOLLOW_DISTANCE)
      .addScaledVector(this.up, FOLLOW_HEIGHT);

    this.desiredPosition.copy(
      this.collisionWorld.raycastToColliders(
        this.targetPosition,
        this.safeCameraPosition,
        CAMERA_COLLISION_PADDING
      )
    );
  }

  private updateBobbing(deltaSeconds: number, movement: MovementState): void {
    const moveAmount =
      movement.grounded && movement.moving
        ? THREE.MathUtils.clamp(movement.speed / 5.8, 0, 1)
        : 0;
    const blendT = 1 - Math.exp(-8 * deltaSeconds);
    this.bobBlend = THREE.MathUtils.lerp(this.bobBlend, moveAmount, blendT);

    const frequency = movement.running ? 11.5 : 8.4;
    this.bobTime += deltaSeconds * frequency * (0.55 + this.bobBlend);
    this.bobOffset = Math.sin(this.bobTime) * 0.035 * this.bobBlend;
  }
}
