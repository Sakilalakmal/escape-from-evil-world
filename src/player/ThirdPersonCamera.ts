import * as THREE from 'three';

export class ThirdPersonCamera {
  private readonly targetPosition = new THREE.Vector3();
  private readonly desiredPosition = new THREE.Vector3();
  private readonly desiredLookAt = new THREE.Vector3();
  private readonly lookAtPoint = new THREE.Vector3();

  private readonly followOffset = new THREE.Vector3(0, 4.8, -8.8);
  private readonly lookOffset = new THREE.Vector3(0, 2.1, 0);

  private readonly followSharpness = 10;
  private readonly lookSharpness = 12;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly target: THREE.Object3D
  ) {}

  snap(): void {
    this.target.getWorldPosition(this.targetPosition);

    this.desiredPosition
      .copy(this.followOffset)
      .applyQuaternion(this.target.quaternion)
      .add(this.targetPosition);

    this.lookAtPoint.copy(this.targetPosition).add(this.lookOffset);
    this.camera.position.copy(this.desiredPosition);
    this.camera.lookAt(this.lookAtPoint);
  }

  update(deltaSeconds: number): void {
    this.target.getWorldPosition(this.targetPosition);

    this.desiredPosition
      .copy(this.followOffset)
      .applyQuaternion(this.target.quaternion)
      .add(this.targetPosition);

    const followT = 1 - Math.exp(-this.followSharpness * deltaSeconds);
    this.camera.position.lerp(this.desiredPosition, followT);

    this.desiredLookAt.copy(this.targetPosition).add(this.lookOffset);
    const lookT = 1 - Math.exp(-this.lookSharpness * deltaSeconds);
    this.lookAtPoint.lerp(this.desiredLookAt, lookT);
    this.camera.lookAt(this.lookAtPoint);
  }
}
