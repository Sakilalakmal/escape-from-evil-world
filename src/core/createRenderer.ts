import * as THREE from 'three';

export function createRenderer(): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const physicallyLitRenderer = renderer as THREE.WebGLRenderer & {
    physicallyCorrectLights?: boolean;
    useLegacyLights?: boolean;
  };

  if (typeof physicallyLitRenderer.physicallyCorrectLights === 'boolean') {
    physicallyLitRenderer.physicallyCorrectLights = true;
  }

  if (typeof physicallyLitRenderer.useLegacyLights === 'boolean') {
    physicallyLitRenderer.useLegacyLights = false;
  }

  return renderer;
}
