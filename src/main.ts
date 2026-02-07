import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createCamera } from './core/createCamera';
import { createLights } from './core/createLights';
import { createLoop } from './core/createLoop';
import { createRenderer } from './core/createRenderer';
import { createResizeHandler } from './core/createResizeHandler';
import { createScene } from './core/createScene';
import { createFog } from './world/createFog';
import { createGround } from './world/createGround';
import { createRuinsBlockout } from './world/createRuinsBlockout';
import { createSky } from './world/createSky';
import './ui/overlay.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node.');
}

const scene = createScene();
const camera = createCamera();
const renderer = createRenderer();
app.appendChild(renderer.domElement);

createFog(scene);
createSky(scene);
scene.add(createGround());
scene.add(createRuinsBlockout());
scene.add(createLights());

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 8;
controls.maxDistance = 70;
controls.maxPolarAngle = Math.PI * 0.48;
controls.target.set(0, 2, 0);
controls.update();

const loop = createLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

createResizeHandler(camera, renderer);
loop.start();
