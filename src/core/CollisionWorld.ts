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
      if (climbHeight <= params.stepHeight + 0.01) {
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

      return {
        position: nextPosition,
        collided,
        grounded: true,
        groundY: nextPosition.y
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
