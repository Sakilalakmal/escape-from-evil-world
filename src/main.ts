import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioManager } from './audio/AudioManager';
import { CollisionWorld } from './core/CollisionWorld';
import { Input } from './core/Input';
import { PointerLock } from './core/PointerLock';
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
import { Overlay } from './ui/Overlay';
import { Campfire } from './world/Campfire';
import { createFog } from './world/createFog';
import { createGround } from './world/createGround';
import { createRuinsBlockout } from './world/createRuinsBlockout';
import { createSky } from './world/createSky';
import { JungleSetDressing } from './world/JungleSetDressing';
import './ui/overlay.css';

const WORLD_EDGE = 102;
const BOUNDARY_HEIGHT = 18;
const BOUNDARY_THICKNESS = 3;

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Missing #app mount node.');
}

function createWorldBoundaries(world: CollisionWorld): void {
  world.addBoxes([
    {
      min: new THREE.Vector3(-WORLD_EDGE, 0, -WORLD_EDGE - BOUNDARY_THICKNESS),
      max: new THREE.Vector3(WORLD_EDGE, BOUNDARY_HEIGHT, -WORLD_EDGE)
    },
    {
      min: new THREE.Vector3(-WORLD_EDGE, 0, WORLD_EDGE),
      max: new THREE.Vector3(WORLD_EDGE, BOUNDARY_HEIGHT, WORLD_EDGE + BOUNDARY_THICKNESS)
    },
    {
      min: new THREE.Vector3(-WORLD_EDGE - BOUNDARY_THICKNESS, 0, -WORLD_EDGE),
      max: new THREE.Vector3(-WORLD_EDGE, BOUNDARY_HEIGHT, WORLD_EDGE)
    },
    {
      min: new THREE.Vector3(WORLD_EDGE, 0, -WORLD_EDGE),
      max: new THREE.Vector3(WORLD_EDGE + BOUNDARY_THICKNESS, BOUNDARY_HEIGHT, WORLD_EDGE)
    }
  ]);
}

async function bootstrap(): Promise<void> {
  const scene = createScene();
  const camera = createCamera();
  const renderer = createRenderer();
  const input = new Input();
  const time = new Time();
  const overlay = new Overlay();
  const collisionWorld = new CollisionWorld();

  app.appendChild(renderer.domElement);

  createFog(scene);
  createSky(scene);
  scene.add(createGround());
  scene.add(createLights());

  collisionWorld.addWalkableSurface({
    minX: -WORLD_EDGE,
    maxX: WORLD_EDGE,
    minZ: -WORLD_EDGE,
    maxZ: WORLD_EDGE,
    y: 0
  });
  createWorldBoundaries(collisionWorld);

  const ruins = createRuinsBlockout();
  scene.add(ruins.group);
  collisionWorld.addBoxes(ruins.solidColliders);
  collisionWorld.addWalkableSurfaces(ruins.walkableSurfaces);

  const setDressing = new JungleSetDressing(ruins.corner);
  scene.add(setDressing.group);
  collisionWorld.addBoxes(setDressing.solidColliders);

  const campfire = new Campfire(new THREE.Vector3(0, 0, 0));
  scene.add(campfire.group);
  collisionWorld.addBoxes(campfire.solidColliders);
  collisionWorld.addWalkableSurfaces(campfire.walkableSurfaces);

  const crowd = new DancingCrowd(campfire.center, 10);
  scene.add(crowd.group);
  scene.add(crowd.zoneAnchor);
  await crowd.load();

  const player = await Player.create();
  player.object.position.set(0, 0, 28);
  scene.add(player.object);

  const pointerLock = new PointerLock(renderer.domElement);
  pointerLock.setAngles(Math.PI, THREE.MathUtils.degToRad(-10));

  const controller = new CharacterController(
    player,
    input,
    collisionWorld,
    () => pointerLock.yaw
  );
  const followCamera = new ThirdPersonCamera(camera, player.object);
  followCamera.setLookAngles(pointerLock.yaw, pointerLock.pitch);
  followCamera.snap();

  const debugTarget = new THREE.Vector3();
  const debugControls = new OrbitControls(camera, renderer.domElement);
  debugControls.enableDamping = true;
  debugControls.enabled = false;
  debugControls.minDistance = 3;
  debugControls.maxDistance = 80;
  debugControls.maxPolarAngle = Math.PI * 0.49;

  const audio = new AudioManager(camera, campfire.audioAnchor);
  audio.setAudioStateListener((enabled) => overlay.setAudioEnabled(enabled));
  await audio.load();

  let hintsFadingStarted = false;
  const enterExperience = (): void => {
    if (debugControls.enabled) {
      return;
    }

    pointerLock.requestLock();
    void audio.enableAudio();
    if (!hintsFadingStarted) {
      overlay.fadeHintsAfter(5000);
      hintsFadingStarted = true;
    }
  };

  overlay.onEnterRequest(enterExperience);
  renderer.domElement.addEventListener('click', enterExperience);

  pointerLock.onLockChange((locked) => {
    if (debugControls.enabled) {
      overlay.setEnterVisible(false);
      return;
    }

    overlay.setEnterVisible(!locked);
  });

  overlay.setMode('Explore');
  overlay.setEnterVisible(true);

  createResizeHandler(camera, renderer);

  const loop = createLoop(() => {
    const deltaSeconds = time.tick();
    pointerLock.update(deltaSeconds);

    if (input.consumePress('KeyC')) {
      debugControls.enabled = !debugControls.enabled;

      if (debugControls.enabled) {
        pointerLock.setEnabled(false);
        overlay.setMode('Debug');
        overlay.setEnterVisible(false);
      } else {
        pointerLock.setEnabled(true);
        overlay.setMode('Explore');
        overlay.setEnterVisible(!pointerLock.isLocked());
        followCamera.snap();
      }
    }

    const movement = controller.update(deltaSeconds);
    player.update(deltaSeconds);
    crowd.update(deltaSeconds);
    campfire.update(time.elapsed);

    if (debugControls.enabled) {
      debugTarget.copy(player.object.position).y += 1.6;
      debugControls.target.copy(debugTarget);
      debugControls.update();
    } else {
      followCamera.setLookAngles(pointerLock.yaw, pointerLock.pitch);
      followCamera.update(deltaSeconds);
    }

    overlay.setCompassYaw(pointerLock.yaw);
    audio.update(deltaSeconds, movement, player.object.position);
    renderer.render(scene, camera);
    input.clearPressed();
  });

  loop.start();
}

void bootstrap();
