import * as THREE from 'three';

function createRock(
  x: number,
  z: number,
  scale: number,
  material: THREE.Material
): THREE.Mesh {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(scale, 0), material);
  rock.position.set(x, scale * 0.7, z);
  rock.rotation.set(Math.random() * 0.3, Math.random() * Math.PI, 0);
  rock.castShadow = true;
  rock.receiveShadow = true;
  return rock;
}

function createTree(x: number, z: number): THREE.Group {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.55, 5, 8),
    new THREE.MeshStandardMaterial({ color: 0x332719, roughness: 0.95 })
  );
  trunk.position.y = 2.5;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  tree.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x1f3a2a, roughness: 0.9 })
  );
  leaves.position.y = 5.7;
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  tree.add(leaves);

  tree.position.set(x, 0, z);
  return tree;
}

export function createRuinsBlockout(): THREE.Group {
  const ruins = new THREE.Group();
  ruins.position.set(-42, 0, -38);
  ruins.rotation.y = Math.PI * 0.24;

  const stone = new THREE.MeshStandardMaterial({
    color: 0x4f555f,
    roughness: 0.88,
    metalness: 0.03
  });

  for (let step = 0; step < 8; step += 1) {
    const width = 22 - step * 1.2;
    const stair = new THREE.Mesh(new THREE.BoxGeometry(width, 1.4, 7), stone);
    stair.position.set(0, 0.7 + step * 1.4, step * 3.2);
    stair.castShadow = true;
    stair.receiveShadow = true;
    ruins.add(stair);
  }

  const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(3, 14, 3), stone);
  leftPillar.position.set(-6, 17, 27);
  leftPillar.castShadow = true;
  leftPillar.receiveShadow = true;
  ruins.add(leftPillar);

  const rightPillar = leftPillar.clone();
  rightPillar.position.x = 6;
  ruins.add(rightPillar);

  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(15, 2.4, 3.2), stone);
  topBeam.position.set(0, 23.5, 27);
  topBeam.castShadow = true;
  topBeam.receiveShadow = true;
  ruins.add(topBeam);

  const rearBlock = new THREE.Mesh(new THREE.BoxGeometry(11, 9, 3), stone);
  rearBlock.position.set(0, 14.5, 31);
  rearBlock.castShadow = true;
  rearBlock.receiveShadow = true;
  ruins.add(rearBlock);

  const decorations = new THREE.Group();
  const rockMaterial = new THREE.MeshStandardMaterial({
    color: 0x3c424a,
    roughness: 0.96,
    metalness: 0.01
  });

  decorations.add(createRock(-15, -8, 1.8, rockMaterial));
  decorations.add(createRock(-4, -12, 1.2, rockMaterial));
  decorations.add(createRock(14, -10, 2.1, rockMaterial));
  decorations.add(createRock(8, 4, 1.5, rockMaterial));
  decorations.add(createTree(-22, -18));
  decorations.add(createTree(19, -16));
  decorations.add(createTree(25, 5));
  decorations.add(createTree(-28, 7));

  ruins.add(decorations);
  return ruins;
}
