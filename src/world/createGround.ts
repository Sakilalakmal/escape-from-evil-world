import * as THREE from 'three';

function createGroundTexture(): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  ctx.fillStyle = '#254f2d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 1800; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = 0.6 + Math.random() * 2;
    const shade = 38 + Math.floor(Math.random() * 28);
    ctx.fillStyle = `rgba(${shade}, ${80 + Math.floor(Math.random() * 40)}, ${34 + Math.floor(Math.random() * 30)}, 0.28)`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(120, 96, 64, 0.1)';
  for (let i = 0; i < 42; i += 1) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 8, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(24, 24);
  texture.anisotropy = 8;
  return texture;
}

export function createGround(): THREE.Mesh {
  const texture = createGroundTexture();
  const material = new THREE.MeshStandardMaterial({
    color: 0x3d6842,
    map: texture ?? undefined,
    roughness: 0.9,
    metalness: 0.05
  });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 220), material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  return ground;
}
