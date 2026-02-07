import * as THREE from 'three';

const LOOK_DISTANCE = 10;
const FOLLOW_DISTANCE = 7.4;
const FOLLOW_HEIGHT = 3.1;
const LOOK_HEIGHT = 1.7;

export class ThirdPersonCamera {
  private readonly targetPosition = new THREE.Vector3();
  private readonly desiredPosition = new THREE.Vector3();
  private readonly desiredLookAt = new THREE.Vector3();
  private readonly lookAtPoint = new THREE.Vector3();
  private readonly lookDirection = new THREE.Vector3();
  private readonly up = new THREE.Vector3(0, 1, 0);

  private yaw = Math.PI;
  private pitch = THREE.MathUtils.degToRad(-8);

  private readonly followSharpness = 10;
  private readonly lookSharpness = 12;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly target: THREE.Object3D
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

  update(deltaSeconds: number): void {
    this.computeDesiredTransforms();

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

    this.desiredPosition
      .copy(this.targetPosition)
      .addScaledVector(this.lookDirection, -FOLLOW_DISTANCE)
      .addScaledVector(this.up, FOLLOW_HEIGHT);
  }
}
