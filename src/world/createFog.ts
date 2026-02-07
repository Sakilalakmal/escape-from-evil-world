import * as THREE from 'three';

export function createFog(scene: THREE.Scene): THREE.FogExp2 {
  const fog = new THREE.FogExp2(0x07111c, 0.017);
  scene.fog = fog;
  return fog;
}
