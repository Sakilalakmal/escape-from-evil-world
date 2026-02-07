import * as THREE from 'three';

export type BoxCollider = {
  min: THREE.Vector3;
  max: THREE.Vector3;
  stepable?: boolean;
};

export type WalkableSurface = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  y: number;
};

export type CollisionResolveParams = {
  position: THREE.Vector3;
  delta: THREE.Vector3;
  radius: number;
  height: number;
  stepHeight: number;
  groundProbeHeight?: number;
};

export type CollisionResolveResult = {
  position: THREE.Vector3;
  collided: boolean;
  grounded: boolean;
  groundY: number;
};

const DOWN = new THREE.Vector3(0, -1, 0);

export class CollisionWorld {
  private readonly colliders: BoxCollider[] = [];
  private readonly walkableMeshes: THREE.Mesh[] = [];
  private readonly raycaster = new THREE.Raycaster();
  private readonly probeOrigin = new THREE.Vector3();
  private readonly raycastDirection = new THREE.Vector3();
  private readonly expandedMin = new THREE.Vector3();
  private readonly expandedMax = new THREE.Vector3();
  private readonly raycastHit = new THREE.Vector3();

  addBox(box: BoxCollider): void {
    this.colliders.push({
      min: box.min.clone(),
      max: box.max.clone(),
      stepable: box.stepable ?? false
    });
  }

  addBoxes(boxes: BoxCollider[]): void {
    for (const box of boxes) {
      this.addBox(box);
    }
  }

  addWalkableSurface(surface: WalkableSurface): void {
    const width = Math.max(surface.maxX - surface.minX, 0.01);
    const depth = Math.max(surface.maxZ - surface.minZ, 0.01);
    const centerX = (surface.minX + surface.maxX) * 0.5;
    const centerZ = (surface.minZ + surface.maxZ) * 0.5;

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
    );

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(centerX, surface.y, centerZ);
    mesh.updateMatrixWorld(true);
    this.walkableMeshes.push(mesh);
  }

  addWalkableSurfaces(surfaces: WalkableSurface[]): void {
    for (const surface of surfaces) {
      this.addWalkableSurface(surface);
    }
  }

  getGroundHeight(
    x: number,
    z: number,
    originY = 2.5,
    maxDistance = 8
  ): number | null {
    return this.sampleGroundHeight(x, z, originY, maxDistance);
  }

  capsuleIntersects(params: {
    x: number;
    z: number;
    y: number;
    radius: number;
    height: number;
    stepHeight?: number;
  }): boolean {
    return this.intersectsAt(
      params.x,
      params.z,
      params.y,
      params.radius,
      params.height,
      params.stepHeight ?? 0
    );
  }

  raycastToColliders(
    origin: THREE.Vector3,
    target: THREE.Vector3,
    clearance = 0.2
  ): THREE.Vector3 {
    this.raycastDirection.subVectors(target, origin);

    if (this.raycastDirection.lengthSq() <= 1e-8) {
      return target.clone();
    }

    let nearestT = 1;

    for (const collider of this.colliders) {
      this.expandedMin
        .copy(collider.min)
        .addScalar(-clearance);
      this.expandedMax
        .copy(collider.max)
        .addScalar(clearance);

      const hitT = intersectSegmentAabb(
        origin,
        this.raycastDirection,
        this.expandedMin,
        this.expandedMax
      );

      if (hitT !== null && hitT < nearestT) {
        nearestT = hitT;
      }
    }

    if (nearestT < 1) {
      this.raycastHit
        .copy(this.raycastDirection)
        .multiplyScalar(Math.max(0, nearestT - 0.03))
        .add(origin);
      return this.raycastHit.clone();
    }

    return target.clone();
  }

  resolveMovement(params: CollisionResolveParams): CollisionResolveResult {
    const nextPosition = params.position.clone();
    let collided = false;

    if (params.delta.x !== 0) {
      const candidateX = nextPosition.x + params.delta.x;
      if (
        this.intersectsAt(
          candidateX,
          nextPosition.z,
          nextPosition.y,
          params.radius,
          params.height,
          params.stepHeight
        )
      ) {
        collided = true;
      } else {
        nextPosition.x = candidateX;
      }
    }

    if (params.delta.z !== 0) {
      const candidateZ = nextPosition.z + params.delta.z;
      if (
        this.intersectsAt(
          nextPosition.x,
          candidateZ,
          nextPosition.y,
          params.radius,
          params.height,
          params.stepHeight
        )
      ) {
        collided = true;
      } else {
        nextPosition.z = candidateZ;
      }
    }

    const probeHeight = params.groundProbeHeight ?? 1.25;
    const groundProbeY = nextPosition.y + params.stepHeight + probeHeight;
    const groundY = this.sampleGroundHeight(
      nextPosition.x,
      nextPosition.z,
      groundProbeY,
      params.stepHeight + probeHeight + 2
    );

    if (groundY !== null) {
      const climbHeight = groundY - params.position.y;
      const distanceFromGround = params.position.y - groundY;
      const withinSnapRange = distanceFromGround <= params.stepHeight + 0.15;
      if (climbHeight <= params.stepHeight + 0.01 && withinSnapRange) {
        if (
          !this.intersectsAt(
            nextPosition.x,
            nextPosition.z,
            groundY,
            params.radius,
            params.height,
            params.stepHeight
          )
        ) {
          nextPosition.y = groundY;
        }
      }

      const grounded = nextPosition.y - groundY <= 0.12;

      return {
        position: nextPosition,
        collided,
        grounded,
        groundY
      };
    }

    return {
      position: nextPosition,
      collided,
      grounded: false,
      groundY: nextPosition.y
    };
  }

  private sampleGroundHeight(
    x: number,
    z: number,
    originY: number,
    maxDistance: number
  ): number | null {
    this.probeOrigin.set(x, originY, z);
    this.raycaster.set(this.probeOrigin, DOWN);
    this.raycaster.far = maxDistance;

    const hits = this.raycaster.intersectObjects(this.walkableMeshes, false);
    if (hits.length === 0) {
      return null;
    }

    return hits[0].point.y;
  }

  private intersectsAt(
    x: number,
    z: number,
    y: number,
    radius: number,
    height: number,
    stepHeight: number
  ): boolean {
    const playerBottom = y;
    const playerTop = y + height;

    for (const collider of this.colliders) {
      if (playerBottom >= collider.max.y || playerTop <= collider.min.y) {
        continue;
      }

      if (collider.stepable && collider.max.y - playerBottom <= stepHeight + 0.02) {
        continue;
      }

      if (circleIntersectsBoxXZ(x, z, radius, collider.min, collider.max)) {
        return true;
      }
    }

    return false;
  }
}

function intersectSegmentAabb(
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  min: THREE.Vector3,
  max: THREE.Vector3
): number | null {
  let tMin = 0;
  let tMax = 1;

  const axes: Array<'x' | 'y' | 'z'> = ['x', 'y', 'z'];

  for (const axis of axes) {
    const rayOrigin = origin[axis];
    const rayDirection = direction[axis];
    const minValue = min[axis];
    const maxValue = max[axis];

    if (Math.abs(rayDirection) < 1e-7) {
      if (rayOrigin < minValue || rayOrigin > maxValue) {
        return null;
      }
      continue;
    }

    const inverseDirection = 1 / rayDirection;
    let t1 = (minValue - rayOrigin) * inverseDirection;
    let t2 = (maxValue - rayOrigin) * inverseDirection;

    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
    }

    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);

    if (tMin > tMax) {
      return null;
    }
  }

  return tMin >= 0 && tMin <= 1 ? tMin : null;
}

function circleIntersectsBoxXZ(
  x: number,
  z: number,
  radius: number,
  min: THREE.Vector3,
  max: THREE.Vector3
): boolean {
  const closestX = THREE.MathUtils.clamp(x, min.x, max.x);
  const closestZ = THREE.MathUtils.clamp(z, min.z, max.z);
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}
