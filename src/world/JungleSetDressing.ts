import * as THREE from 'three';
import type { BoxCollider } from '../core/CollisionWorld';

const TREE_TRUNK_HEIGHT = 5.4;

export class JungleSetDressing {
  readonly group = new THREE.Group();
  readonly solidColliders: BoxCollider[] = [];

  constructor(ruinsCorner: THREE.Vector3) {
    this.group.name = 'JungleSetDressing';
    this.createTreeCluster();
    this.createBushes();
    this.createRocks();
    this.createRuinsVines(ruinsCorner);
  }

  private createTreeCluster(): void {
    const treePositions = [
      [-34, -25],
      [-26, 32],
      [-6, 44],
      [18, 30],
      [35, 18],
      [42, -12],
      [18, -34],
      [-18, -40],
      [-48, 8]
    ];

    for (const [x, z] of treePositions) {
      const tree = this.createTree(x, z, 1 + Math.random() * 0.15);
      this.group.add(tree);
      this.solidColliders.push({
        min: new THREE.Vector3(x - 0.9, 0, z - 0.9),
        max: new THREE.Vector3(x + 0.9, TREE_TRUNK_HEIGHT, z + 0.9)
      });
    }
  }

  private createBushes(): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0x2f6b3a,
      roughness: 0.96
    });

    const bushPositions = [
      [-18, 17],
      [-8, 22],
      [4, 16],
      [24, 9],
      [29, -6],
      [8, -20],
      [-11, -18]
    ];

    for (const [x, z] of bushPositions) {
      const bush = new THREE.Mesh(
        new THREE.SphereGeometry(1.5 + Math.random() * 0.8, 12, 10),
        material
      );
      bush.position.set(x, 1.1, z);
      bush.scale.y = 0.7;
      bush.castShadow = true;
      bush.receiveShadow = true;
      this.group.add(bush);
    }
  }

  private createRocks(): void {
    const material = new THREE.MeshStandardMaterial({
      color: 0x5f6a66,
      roughness: 0.92,
      metalness: 0.02
    });

    const rocks = [
      [-22, 6, 1.8],
      [-2, 30, 1.3],
      [16, 21, 1.5],
      [34, 2, 1.9],
      [31, -24, 2.2],
      [-38, -8, 1.4]
    ];

    for (const [x, z, s] of rocks) {
      const rock = new THREE.Mesh(
        new THREE.DodecahedronGeometry(s, 0),
        material
      );
      rock.position.set(x, s * 0.58, z);
      rock.rotation.y = Math.random() * Math.PI;
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.group.add(rock);

      this.solidColliders.push({
        min: new THREE.Vector3(x - s * 0.8, 0, z - s * 0.8),
        max: new THREE.Vector3(x + s * 0.8, s * 1.25, z + s * 0.8)
      });
    }
  }

  private createRuinsVines(ruinsCorner: THREE.Vector3): void {
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x465249,
      roughness: 0.9
    });
    const vineMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f7c4d,
      roughness: 0.95
    });

    const archRoot = new THREE.Group();
    archRoot.position.set(ruinsCorner.x - 10, 0, ruinsCorner.z + 22);
    this.group.add(archRoot);

    const pillarLeft = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 6, 1.2),
      pillarMaterial
    );
    pillarLeft.position.set(-2.6, 3, 0);
    pillarLeft.castShadow = true;
    pillarLeft.receiveShadow = true;
    archRoot.add(pillarLeft);

    const pillarRight = pillarLeft.clone();
    pillarRight.position.x = 2.6;
    archRoot.add(pillarRight);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1, 1.2), pillarMaterial);
    cap.position.set(0, 6.4, 0);
    cap.castShadow = true;
    cap.receiveShadow = true;
    archRoot.add(cap);

    const vine = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.14, 8, 24, Math.PI),
      vineMaterial
    );
    vine.rotation.y = Math.PI;
    vine.position.set(0, 6.2, 0.42);
    vine.castShadow = true;
    archRoot.add(vine);

    const vineTwo = vine.clone();
    vineTwo.scale.setScalar(0.8);
    vineTwo.position.set(0.3, 4.9, 0.54);
    archRoot.add(vineTwo);

    this.solidColliders.push({
      min: new THREE.Vector3(
        archRoot.position.x - 3.2,
        0,
        archRoot.position.z - 0.8
      ),
      max: new THREE.Vector3(
        archRoot.position.x + 3.2,
        6.9,
        archRoot.position.z + 0.8
      )
    });
  }

  private createTree(x: number, z: number, scale = 1): THREE.Group {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.8, TREE_TRUNK_HEIGHT, 8),
      new THREE.MeshStandardMaterial({ color: 0x5b3a24, roughness: 0.92 })
    );
    trunk.position.y = (TREE_TRUNK_HEIGHT * 0.5) * scale;
    trunk.scale.setScalar(scale);
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    const canopyMaterial = new THREE.MeshStandardMaterial({
      color: 0x2f7f43,
      roughness: 0.88
    });

    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(2.9, 10, 8),
      canopyMaterial
    );
    canopy.position.y = TREE_TRUNK_HEIGHT * scale + 2.2 * scale;
    canopy.scale.set(1.3, 0.95, 1.2);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    tree.add(canopy);

    const canopyTwo = canopy.clone();
    canopyTwo.position.set(-1.1 * scale, TREE_TRUNK_HEIGHT * scale + 1.7 * scale, 0.2);
    canopyTwo.scale.set(1, 0.85, 1);
    tree.add(canopyTwo);

    tree.position.set(x, 0, z);
    return tree;
  }
}
