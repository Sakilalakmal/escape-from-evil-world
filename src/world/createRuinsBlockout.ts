import * as THREE from 'three';
import type { BoxCollider, WalkableSurface } from '../core/CollisionWorld';

export type RuinsBlockout = {
  group: THREE.Group;
  solidColliders: BoxCollider[];
  walkableSurfaces: WalkableSurface[];
  corner: THREE.Vector3;
};

const RUINS_CORNER = new THREE.Vector3(50, 0, -62);

function tintGeometry(geometry: THREE.BufferGeometry, variance = 0.18): void {
  const position = geometry.getAttribute('position');
  const colors = new Float32Array(position.count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < position.count; i += 1) {
    const y = position.getY(i);
    const noise = (Math.sin(position.getX(i) * 1.7 + position.getZ(i) * 2.1) + 1) * 0.5;
    const shade = 0.62 + noise * variance + y * 0.015;
    color.setRGB(shade, shade * 1.02, shade * 1.08);
    colors[i * 3 + 0] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function addBoxCollider(
  colliders: BoxCollider[],
  surfaces: WalkableSurface[],
  origin: THREE.Vector3,
  center: THREE.Vector3,
  size: THREE.Vector3,
  options?: { stepable?: boolean; walkableTop?: boolean }
): void {
  const worldCenter = center.clone().add(origin);
  const half = size.clone().multiplyScalar(0.5);
  colliders.push({
    min: worldCenter.clone().sub(half),
    max: worldCenter.clone().add(half),
    stepable: options?.stepable ?? false
  });

  if (options?.walkableTop) {
    surfaces.push({
      minX: worldCenter.x - half.x,
      maxX: worldCenter.x + half.x,
      minZ: worldCenter.z - half.z,
      maxZ: worldCenter.z + half.z,
      y: worldCenter.y + half.y
    });
  }
}

export function createRuinsBlockout(): RuinsBlockout {
  const group = new THREE.Group();
  group.name = 'RuinsBlockout';
  group.position.copy(RUINS_CORNER);

  const colliders: BoxCollider[] = [];
  const walkableSurfaces: WalkableSurface[] = [];

  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x78807b,
    roughness: 0.92,
    metalness: 0.02,
    vertexColors: true
  });

  const stepHeight = 0.42;
  const stepDepth = 2.35;
  const stepCount = 8;

  for (let i = 0; i < stepCount; i += 1) {
    const width = 20 - i * 0.9;
    const size = new THREE.Vector3(width, stepHeight, 5.3);
    const center = new THREE.Vector3(0, stepHeight * 0.5 + i * stepHeight, i * stepDepth);

    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    tintGeometry(geometry);
    const stair = new THREE.Mesh(geometry, stoneMaterial);
    stair.position.copy(center);
    stair.castShadow = true;
    stair.receiveShadow = true;
    group.add(stair);

    addBoxCollider(colliders, walkableSurfaces, RUINS_CORNER, center, size, {
      stepable: true,
      walkableTop: true
    });
  }

  const platformSize = new THREE.Vector3(14, 1.2, 8);
  const platformCenter = new THREE.Vector3(0, stepCount * stepHeight + 0.6, 20.2);
  const platformGeometry = new THREE.BoxGeometry(
    platformSize.x,
    platformSize.y,
    platformSize.z
  );
  tintGeometry(platformGeometry, 0.22);
  const platform = new THREE.Mesh(platformGeometry, stoneMaterial);
  platform.position.copy(platformCenter);
  platform.castShadow = true;
  platform.receiveShadow = true;
  group.add(platform);

  addBoxCollider(colliders, walkableSurfaces, RUINS_CORNER, platformCenter, platformSize, {
    stepable: true,
    walkableTop: true
  });

  const pillarSize = new THREE.Vector3(2.8, 13, 2.8);
  const pillarY = stepCount * stepHeight + 7.1;
  const leftPillarCenter = new THREE.Vector3(-4.6, pillarY, 24.2);
  const rightPillarCenter = new THREE.Vector3(4.6, pillarY, 24.2);

  const pillarGeometry = new THREE.BoxGeometry(
    pillarSize.x,
    pillarSize.y,
    pillarSize.z
  );
  tintGeometry(pillarGeometry, 0.2);

  const leftPillar = new THREE.Mesh(pillarGeometry, stoneMaterial);
  leftPillar.position.copy(leftPillarCenter);
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  group.add(leftPillar);

  const rightPillar = leftPillar.clone();
  rightPillar.position.copy(rightPillarCenter);
  group.add(rightPillar);

  addBoxCollider(colliders, walkableSurfaces, RUINS_CORNER, leftPillarCenter, pillarSize);
  addBoxCollider(colliders, walkableSurfaces, RUINS_CORNER, rightPillarCenter, pillarSize);

  const beamSize = new THREE.Vector3(13.8, 2.2, 3.1);
  const beamCenter = new THREE.Vector3(0, pillarY + 7.1, 24.2);
  const beamGeometry = new THREE.BoxGeometry(beamSize.x, beamSize.y, beamSize.z);
  tintGeometry(beamGeometry, 0.24);
  const beam = new THREE.Mesh(beamGeometry, stoneMaterial);
  beam.position.copy(beamCenter);
  beam.castShadow = true;
  beam.receiveShadow = true;
  group.add(beam);
  addBoxCollider(colliders, walkableSurfaces, RUINS_CORNER, beamCenter, beamSize);

  const wallSize = new THREE.Vector3(10.8, 8.5, 2.8);
  const wallCenter = new THREE.Vector3(0, stepCount * stepHeight + 4.55, 28.1);
  const wallGeometry = new THREE.BoxGeometry(wallSize.x, wallSize.y, wallSize.z);
  tintGeometry(wallGeometry, 0.18);
  const backWall = new THREE.Mesh(wallGeometry, stoneMaterial);
  backWall.position.copy(wallCenter);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  group.add(backWall);
  addBoxCollider(colliders, walkableSurfaces, RUINS_CORNER, wallCenter, wallSize);

  return {
    group,
    solidColliders: colliders,
    walkableSurfaces,
    corner: RUINS_CORNER.clone()
  };
}
