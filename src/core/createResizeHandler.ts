import * as THREE from 'three';

export function createResizeHandler(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
): () => void {
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}
