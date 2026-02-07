import * as THREE from 'three';

export function createLights(): THREE.Group {
  const lights = new THREE.Group();

  const ambient = new THREE.AmbientLight(0x334760, 0.25);
  lights.add(ambient);

  const hemi = new THREE.HemisphereLight(0x2f4664, 0x090e12, 0.2);
  hemi.position.set(0, 30, 0);
  lights.add(hemi);

  const moon = new THREE.DirectionalLight(0xc9daff, 1.2);
  moon.position.set(-28, 34, -16);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.near = 1;
  moon.shadow.camera.far = 120;
  moon.shadow.camera.left = -45;
  moon.shadow.camera.right = 45;
  moon.shadow.camera.top = 45;
  moon.shadow.camera.bottom = -45;
  lights.add(moon);

  const moonTarget = new THREE.Object3D();
  moonTarget.position.set(0, 0, 0);
  lights.add(moonTarget);
  moon.target = moonTarget;

  return lights;
}
