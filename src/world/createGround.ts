import * as THREE from 'three';

function createGroundTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.fillStyle = '#2d5a33';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#3a6a3e';

  for (let y = 0; y < canvas.height; y += 16) {
    for (let x = 0; x < canvas.width; x += 16) {
      if ((x + y) % 32 === 0) {
        ctx.fillRect(x, y, 16, 16);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(45, 45);
  texture.anisotropy = 4;
  return texture;
}

export function createGround(): THREE.Mesh {
  const texture = createGroundTexture();
  const material = new THREE.MeshStandardMaterial({
    color: 0x3f6d3d,
    map: texture ?? undefined,
    roughness: 0.94,
    metalness: 0.02
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  return ground;
}
