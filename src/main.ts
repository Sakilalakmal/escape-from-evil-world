import * as THREE from 'three';
import { AudioManager } from './audio/AudioManager';
import { CollisionWorld } from './core/CollisionWorld';
import { Input } from './core/Input';
import { PointerLock } from './core/PointerLock';
import { PostFX } from './core/PostFX';
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
import { Gate } from './world/Gate';
import { createFog } from './world/createFog';
import { createGround } from './world/createGround';
import { createRuinsBlockout } from './world/createRuinsBlockout';
import { createSky } from './world/createSky';
import { JungleSetDressing } from './world/JungleSetDressing';
import './ui/overlay.css';

const WORLD_EDGE = 102;
const BOUNDARY_HEIGHT = 18;
const BOUNDARY_THICKNESS = 3;
const SPAWN_PAN_DURATION = 2;
const ENABLE_SPAWN_PAN = true;
const ENABLE_SAO = false;

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

  const gate = new Gate(new THREE.Vector3(0, 0, 94), campfire.center);
  scene.add(gate.group);
  collisionWorld.addBoxes(gate.solidColliders);
  collisionWorld.addWalkableSurfaces(gate.walkableSurfaces);

  const player = await Player.create();
  player.object.position.copy(gate.spawnPosition);
  player.object.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), gate.spawnYaw);
  scene.add(player.object);

  const pointerLock = new PointerLock(renderer.domElement);
  pointerLock.setAngles(gate.spawnYaw, THREE.MathUtils.degToRad(-11));

  const controller = new CharacterController(
    player,
    input,
    collisionWorld,
    () => pointerLock.yaw
  );

  const followCamera = new ThirdPersonCamera(camera, player.object, collisionWorld);
  followCamera.setLookAngles(pointerLock.yaw, pointerLock.pitch);
  followCamera.snap();

  const audio = new AudioManager(camera, campfire.audioAnchor);
  audio.setAudioStateListener((enabled) => overlay.setAudioEnabled(enabled));
  await audio.load();

  const postFX = new PostFX(renderer, scene, camera, { enableSAO: ENABLE_SAO });
  postFX.setSize(window.innerWidth, window.innerHeight);
  createResizeHandler(camera, renderer, (width, height) => postFX.setSize(width, height));

  let hasEnteredWorld = false;
  let hudVisible = true;
  let spawnPanActive = false;
  let spawnPanTime = 0;

  const panStartPosition = gate.center.clone().add(new THREE.Vector3(0, 5.2, 8.5));
  const panEndPosition = new THREE.Vector3(0, 4.5, 15.5);
  const panStartLookAt = gate.center.clone().add(new THREE.Vector3(0, 2.1, -5));
  const panEndLookAt = campfire.center.clone().add(new THREE.Vector3(0, 1.4, 0));
  const panCurrentLookAt = new THREE.Vector3();

  const enterWorld = (): void => {
    if (hasEnteredWorld) {
      return;
    }

    hasEnteredWorld = true;
    spawnPanActive = ENABLE_SPAWN_PAN;
    spawnPanTime = 0;

    overlay.hideIntro();
    overlay.fadeFromBlack(800);
    overlay.setHudVisible(hudVisible);

    pointerLock.requestLock();
    void audio.enableAudio();

    if (spawnPanActive) {
      camera.position.copy(panStartPosition);
      camera.lookAt(panStartLookAt);
    } else {
      followCamera.snap();
    }
  };

  overlay.onEnterRequest(enterWorld);

  renderer.domElement.addEventListener('click', () => {
    if (hasEnteredWorld && !pointerLock.isLocked()) {
      pointerLock.requestLock();
    }
  });

  pointerLock.onLockChange((locked) => {
    overlay.setPointerHintVisible(hasEnteredWorld && !locked);
  });

  const distanceScratch = new THREE.Vector3();

  const loop = createLoop(() => {
    const deltaSeconds = time.tick();
    campfire.update(time.elapsed);
    crowd.update(deltaSeconds);

    if (!hasEnteredWorld) {
      player.update(deltaSeconds);
      postFX.render();
      input.clearPressed();
      return;
    }

    if (input.consumePress('Tab')) {
      hudVisible = !hudVisible;
      overlay.setHudVisible(hudVisible);
    }

    pointerLock.update(deltaSeconds);
    const movement = controller.update(deltaSeconds);
    player.update(deltaSeconds);
    followCamera.setLookAngles(pointerLock.yaw, pointerLock.pitch);

    if (spawnPanActive) {
      spawnPanTime += deltaSeconds;
      const t = THREE.MathUtils.clamp(spawnPanTime / SPAWN_PAN_DURATION, 0, 1);
      const eased = t * t * (3 - 2 * t);

      camera.position.lerpVectors(panStartPosition, panEndPosition, eased);
      panCurrentLookAt.lerpVectors(panStartLookAt, panEndLookAt, eased);
      camera.lookAt(panCurrentLookAt);

      if (t >= 1) {
        spawnPanActive = false;
        followCamera.snap();
      }
    } else {
      followCamera.update(deltaSeconds, movement);
    }

    overlay.setCompassYaw(pointerLock.yaw);
    audio.update(deltaSeconds, movement, player.object.position);

    const distanceToCampfire = player.object.position.distanceTo(campfire.center);
    const distanceToDancers = player.object.position.distanceTo(crowd.zoneCenter);
    distanceScratch
      .copy(player.object.position)
      .sub(ruins.stairsTopCenter)
      .setY(0);
    const atStairsTop =
      player.object.position.y >= ruins.stairsTopY - 0.2 &&
      distanceScratch.length() < 11;

    overlay.setObjectiveCompleted('campfire', distanceToCampfire < 7.5);
    overlay.setObjectiveCompleted('dancers', distanceToDancers < 10.5);
    overlay.setObjectiveCompleted('stairs', atStairsTop);

    const distanceToGate = player.object.position.distanceTo(gate.center);
    if (distanceToCampfire < 5.5) {
      overlay.setContextPrompt('Press E to Warm Up');
    } else if (distanceToGate < 7.8) {
      overlay.setContextPrompt('Press E to Leave');
    } else {
      overlay.setContextPrompt(null);
    }

    postFX.render();
    input.clearPressed();
  });

  loop.start();
}

void bootstrap();
