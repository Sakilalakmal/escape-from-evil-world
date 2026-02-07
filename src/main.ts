import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioManager } from './audio/AudioManager';
import { Input } from './core/Input';
import { Time } from './core/Time';
import { createCamera } from './core/createCamera';
import { createLights } from './core/createLights';
import { createLoop } from './core/createLoop';
import { createRenderer } from './core/createRenderer';
import { createResizeHandler } from './core/createResizeHandler';
import { createScene } from './core/createScene';
import { DancingCrowd } from './npc/DancingCrowd';
import { CharacterController } from './player/CharacterController';
import { Player } from './player/Player';
import { ThirdPersonCamera } from './player/ThirdPersonCamera';
import { HUD } from './ui/HUD';
import { createFog } from './world/createFog';
import { createGround } from './world/createGround';
import { createRuinsBlockout } from './world/createRuinsBlockout';
import { createSky } from './world/createSky';
import './ui/overlay.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node.');
}

async function bootstrap(): Promise<void> {
  const scene = createScene();
  const camera = createCamera();
  const renderer = createRenderer();
  const input = new Input();
  const time = new Time();
  const hud = new HUD();

  app.appendChild(renderer.domElement);

  createFog(scene);
  createSky(scene);
  scene.add(createGround());
  scene.add(createLights());

  const ruins = createRuinsBlockout();
  scene.add(ruins);

  const danceZoneCenter = new THREE.Vector3(-30, 0, -26);
  const crowd = new DancingCrowd(danceZoneCenter, 10);
  scene.add(crowd.group);
  scene.add(crowd.zoneAnchor);
  await crowd.load();

  const player = await Player.create();
  player.object.position.set(0, 0, 8);
  scene.add(player.object);

  const controller = new CharacterController(player, input, camera);
  const followCamera = new ThirdPersonCamera(camera, player.object);
  followCamera.snap();

  const debugTarget = new THREE.Vector3();
  const debugControls = new OrbitControls(camera, renderer.domElement);
  debugControls.enableDamping = true;
  debugControls.enabled = false;
  debugControls.minDistance = 3;
  debugControls.maxDistance = 70;
  debugControls.maxPolarAngle = Math.PI * 0.49;

  const audio = new AudioManager(camera, crowd.zoneAnchor);
  audio.setAudioStateListener((enabled) => hud.setAudioEnabled(enabled));
  await audio.load();

  createResizeHandler(camera, renderer);

  const loop = createLoop(() => {
    const deltaSeconds = time.tick();

    if (input.consumePress('KeyC')) {
      debugControls.enabled = !debugControls.enabled;
      if (!debugControls.enabled) {
        followCamera.snap();
      }
    }

    const movement = controller.update(deltaSeconds);
    player.update(deltaSeconds);
    crowd.update(deltaSeconds);

    if (debugControls.enabled) {
      debugTarget.copy(player.object.position).y += 1.8;
      debugControls.target.copy(debugTarget);
      debugControls.update();
    } else {
      followCamera.update(deltaSeconds);
    }

    audio.update(deltaSeconds, movement, player.object.position);
    renderer.render(scene, camera);
    input.clearPressed();
  });

  loop.start();
}

void bootstrap();
