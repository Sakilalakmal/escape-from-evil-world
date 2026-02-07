import * as THREE from 'three';
import type { BoxCollider, WalkableSurface } from '../core/CollisionWorld';

const CAMP_RADIUS = 8.5;

type Ember = {
  mesh: THREE.Mesh;
  phase: number;
  radius: number;
  speed: number;
  height: number;
};

export class Campfire {
  readonly group = new THREE.Group();
  readonly audioAnchor = new THREE.Object3D();
  readonly solidColliders: BoxCollider[] = [];
  readonly walkableSurfaces: WalkableSurface[] = [];
  readonly center: THREE.Vector3;

  private readonly flameLight = new THREE.PointLight(0xff8b2d, 2.8, 45, 2);
  private readonly embers: Ember[] = [];

  constructor(center = new THREE.Vector3(0, 0, 0)) {
    this.center = center.clone();
    this.group.position.copy(this.center);
    this.group.name = 'CampfireZone';
    this.audioAnchor.position.set(0, 1.7, 0);
    this.group.add(this.audioAnchor);

    this.buildCampRing();
    this.buildLogsAndFlame();
    this.buildEmbers();
  }

  update(elapsedSeconds: number): void {
    const pulse = Math.sin(elapsedSeconds * 6.4) * 0.35;
    const flutter = Math.sin(elapsedSeconds * 17.2 + 1.2) * 0.2;
    this.flameLight.intensity = 2.8 + pulse + flutter;
    this.flameLight.distance = 42 + Math.sin(elapsedSeconds * 3.5) * 2;

    for (const ember of this.embers) {
      const t = (elapsedSeconds * ember.speed + ember.phase) % 1;
      const angle = ember.phase * Math.PI * 2 + elapsedSeconds * 0.6;
      ember.mesh.position.set(
        Math.cos(angle) * ember.radius,
        0.7 + t * ember.height,
        Math.sin(angle) * ember.radius
      );
      ember.mesh.scale.setScalar(0.7 + (1 - t) * 0.6);
      ember.mesh.material.opacity = 0.15 + (1 - t) * 0.7;
    }
  }

  private buildCampRing(): void {
    const floor = new THREE.Mesh(
      new THREE.CylinderGeometry(CAMP_RADIUS, CAMP_RADIUS + 0.8, 0.24, 28),
      new THREE.MeshStandardMaterial({
        color: 0x415a34,
        roughness: 0.95,
        metalness: 0.02
      })
    );
    floor.position.y = 0.12;
    floor.receiveShadow = true;
    this.group.add(floor);

    this.walkableSurfaces.push({
      minX: this.center.x - CAMP_RADIUS,
      maxX: this.center.x + CAMP_RADIUS,
      minZ: this.center.z - CAMP_RADIUS,
      maxZ: this.center.z + CAMP_RADIUS,
      y: 0.24
    });

    this.solidColliders.push({
      min: new THREE.Vector3(this.center.x - CAMP_RADIUS, 0, this.center.z - CAMP_RADIUS),
      max: new THREE.Vector3(this.center.x + CAMP_RADIUS, 0.24, this.center.z + CAMP_RADIUS),
      stepable: true
    });

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x66726c,
      roughness: 0.92,
      metalness: 0.03
    });

    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2;
      const r = 3.4 + ((i % 3) - 1) * 0.12;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.35 + (i % 2) * 0.08, 0),
        stoneMat
      );
      rock.position.set(x, 0.28, z);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);
    }
  }

  private buildLogsAndFlame(): void {
    const logMaterial = new THREE.MeshStandardMaterial({
      color: 0x5a3b24,
      roughness: 0.88,
      metalness: 0.04
    });

    for (let i = 0; i < 3; i += 1) {
      const log = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 2.5, 8),
        logMaterial
      );
      log.rotation.z = Math.PI / 2;
      log.rotation.y = (i / 3) * Math.PI;
      log.position.y = 0.34;
      log.castShadow = true;
      log.receiveShadow = true;
      this.group.add(log);
    }

    this.solidColliders.push({
      min: new THREE.Vector3(this.center.x - 1.4, 0.08, this.center.z - 1.4),
      max: new THREE.Vector3(this.center.x + 1.4, 1.2, this.center.z + 1.4)
    });

    const flameOuter = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.8, 9),
      new THREE.MeshStandardMaterial({
        color: 0xff9f3d,
        emissive: 0xff5f0d,
        emissiveIntensity: 1.25,
        roughness: 0.4,
        metalness: 0
      })
    );
    flameOuter.position.y = 1.25;
    flameOuter.castShadow = false;
    this.group.add(flameOuter);

    const flameCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.36, 12, 10),
      new THREE.MeshStandardMaterial({
        color: 0xffc668,
        emissive: 0xff8f1f,
        emissiveIntensity: 1.4,
        roughness: 0.25
      })
    );
    flameCore.position.y = 0.92;
    this.group.add(flameCore);

    this.flameLight.position.set(0, 1.8, 0);
    this.flameLight.castShadow = true;
    this.flameLight.shadow.mapSize.set(512, 512);
    this.group.add(this.flameLight);
  }

  private buildEmbers(): void {
    const emberMaterial = new THREE.MeshBasicMaterial({
      color: 0xffa950,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < 10; i += 1) {
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), emberMaterial);
      this.group.add(mesh);
      this.embers.push({
        mesh,
        phase: i / 10,
        radius: 0.25 + Math.random() * 0.5,
        speed: 0.26 + Math.random() * 0.3,
        height: 1.8 + Math.random() * 1.6
      });
    }
  }
}
