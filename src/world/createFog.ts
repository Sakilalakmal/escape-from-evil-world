import * as THREE from 'three';

export function createFog(scene: THREE.Scene): THREE.FogExp2 {
  const fog = new THREE.FogExp2(0x5a805c, 0.0095);
  scene.fog = fog;
  return fog;
}
