import * as THREE from 'three';

export function createResizeHandler(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  onResizeExtra?: (width: number, height: number) => void
): () => void {
  const onResize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    onResizeExtra?.(width, height);
  };

  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}
