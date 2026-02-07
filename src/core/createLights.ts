import * as THREE from 'three';

export function createLights(): THREE.Group {
  const lights = new THREE.Group();

  const ambient = new THREE.AmbientLight(0x8fb690, 0.36);
  lights.add(ambient);

  const hemi = new THREE.HemisphereLight(0xaedeb0, 0x45623f, 0.62);
  hemi.position.set(0, 42, 0);
  lights.add(hemi);

  const sun = new THREE.DirectionalLight(0xe6ffcf, 1.2);
  sun.position.set(35, 48, 18);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 180;
  sun.shadow.camera.left = -70;
  sun.shadow.camera.right = 70;
  sun.shadow.camera.top = 70;
  sun.shadow.camera.bottom = -70;
  lights.add(sun);

  const sunTarget = new THREE.Object3D();
  sunTarget.position.set(0, 0, 0);
  lights.add(sunTarget);
  sun.target = sunTarget;

  return lights;
}
