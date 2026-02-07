import * as THREE from 'three';
import type { BoxCollider, WalkableSurface } from '../core/CollisionWorld';

export class Gate {
  readonly group = new THREE.Group();
  readonly solidColliders: BoxCollider[] = [];
  readonly walkableSurfaces: WalkableSurface[] = [];
  readonly center: THREE.Vector3;
  readonly spawnPosition: THREE.Vector3;
  readonly spawnYaw: number;

  constructor(
    center = new THREE.Vector3(0, 0, 94),
    facingTarget = new THREE.Vector3(0, 0, 0)
  ) {
    this.center = center.clone();
    this.group.position.copy(this.center);
    this.group.name = 'JungleGate';

    const stoneMaterial = new THREE.MeshStandardMaterial({
      color: 0x646d66,
      roughness: 0.9,
      metalness: 0.06
    });
    const vineMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f7c4d,
      roughness: 0.95
    });

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.48, 4.8),
      stoneMaterial
    );
    base.position.set(0, 0.24, 0);
    base.receiveShadow = true;
    base.castShadow = true;
    this.group.add(base);
    this.addCollider(new THREE.Vector3(0, 0.24, 0), new THREE.Vector3(14, 0.48, 4.8), true);
    this.walkableSurfaces.push({
      minX: this.center.x - 7,
      maxX: this.center.x + 7,
      minZ: this.center.z - 2.4,
      maxZ: this.center.z + 2.4,
      y: 0.48
    });

    const pillarGeometry = new THREE.BoxGeometry(2.2, 8.4, 2.2);
    const leftPillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
    leftPillar.position.set(-4.1, 4.2, 0);
    leftPillar.castShadow = true;
    leftPillar.receiveShadow = true;
    this.group.add(leftPillar);
    this.addCollider(leftPillar.position, new THREE.Vector3(2.2, 8.4, 2.2));

    const rightPillar = leftPillar.clone();
    rightPillar.position.x = 4.1;
    this.group.add(rightPillar);
    this.addCollider(rightPillar.position, new THREE.Vector3(2.2, 8.4, 2.2));

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(10.8, 2.2, 2.4),
      stoneMaterial
    );
    lintel.position.set(0, 8.6, 0);
    lintel.castShadow = true;
    lintel.receiveShadow = true;
    this.group.add(lintel);
    this.addCollider(lintel.position, new THREE.Vector3(10.8, 2.2, 2.4));

    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(4.1, 0.55, 10, 22, Math.PI),
      stoneMaterial
    );
    arch.rotation.set(Math.PI / 2, 0, Math.PI);
    arch.position.set(0, 6.4, 0.8);
    arch.castShadow = true;
    arch.receiveShadow = true;
    this.group.add(arch);

    for (let i = 0; i < 7; i += 1) {
      const vine = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.1, 5.2 + Math.random() * 2.8, 6),
        vineMaterial
      );
      vine.position.set(-4.6 + i * 1.55, 7.4, 1 + Math.sin(i) * 0.25);
      vine.rotation.z = (Math.random() - 0.5) * 0.25;
      vine.castShadow = true;
      this.group.add(vine);
    }

    const torchMaterial = new THREE.MeshStandardMaterial({
      color: 0x9f7f43,
      emissive: 0x473315,
      emissiveIntensity: 0.8,
      roughness: 0.62,
      metalness: 0.1
    });

    const leftTorch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 1.4, 10),
      torchMaterial
    );
    leftTorch.position.set(-5.6, 2.3, 1.4);
    leftTorch.castShadow = true;
    this.group.add(leftTorch);

    const rightTorch = leftTorch.clone();
    rightTorch.position.x = 5.6;
    this.group.add(rightTorch);

    this.spawnPosition = this.center.clone().add(new THREE.Vector3(0, 0.48, -3.9));
    this.spawnYaw = Math.atan2(
      facingTarget.x - this.spawnPosition.x,
      facingTarget.z - this.spawnPosition.z
    );
  }

  private addCollider(
    localCenter: THREE.Vector3,
    size: THREE.Vector3,
    stepable = false
  ): void {
    const worldCenter = localCenter.clone().add(this.center);
    const half = size.clone().multiplyScalar(0.5);
    this.solidColliders.push({
      min: worldCenter.clone().sub(half),
      max: worldCenter.clone().add(half),
      stepable
    });
  }
}
