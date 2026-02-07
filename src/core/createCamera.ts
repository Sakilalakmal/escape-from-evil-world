import * as THREE from 'three';

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );

  camera.position.set(18, 12, 18);
  camera.lookAt(0, 2, 0);
  return camera;
}
