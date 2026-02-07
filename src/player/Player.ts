import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type PlayerAnimState = 'idle' | 'walk' | 'run';

type ClipSet = Record<PlayerAnimState, THREE.AnimationClip | null>;
type ActionSet = Partial<Record<PlayerAnimState, THREE.AnimationAction>>;

function pickClipByKeywords(
  clips: THREE.AnimationClip[],
  keywords: string[]
): THREE.AnimationClip | null {
  const lowerKeywords = keywords.map((keyword) => keyword.toLowerCase());

  for (const clip of clips) {
    const clipName = clip.name.toLowerCase();
    if (lowerKeywords.some((keyword) => clipName.includes(keyword))) {
      return clip;
    }
  }

  return clips[0] ?? null;
}

function makePlaceholderModel(): THREE.Group {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 1.2, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x5f7f9a, roughness: 0.85 })
  );
  body.position.y = 1;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xaebfca, roughness: 0.75 })
  );
  head.position.y = 2;
  head.castShadow = true;
  head.receiveShadow = true;
  group.add(head);

  return group;
}

async function loadOptional(
  loader: GLTFLoader,
  path: string,
  label: string
): Promise<THREE.AnimationClip[] | null> {
  try {
    const gltf = await loader.loadAsync(path);
    return gltf.animations;
  } catch (error) {
    console.warn(`[Player] Missing optional ${label} at "${path}".`, error);
    return null;
  }
}

export class Player {
  readonly object = new THREE.Group();

  private readonly mixer: THREE.AnimationMixer | null;
  private readonly actions: ActionSet;
  private currentState: PlayerAnimState = 'idle';

  private constructor(
    model: THREE.Object3D,
    mixer: THREE.AnimationMixer | null,
    actions: ActionSet
  ) {
    this.object.name = 'PlayerRoot';
    this.object.add(model);
    this.mixer = mixer;
    this.actions = actions;

    const preferredState: PlayerAnimState =
      this.actions.idle !== undefined
        ? 'idle'
        : this.actions.walk !== undefined
          ? 'walk'
          : 'run';

    this.currentState = preferredState;
    this.actions[preferredState]?.play();
  }

  static async create(): Promise<Player> {
    const loader = new GLTFLoader();
    const basePath = '/assets/characters/player.glb';

    let model: THREE.Object3D;
    let baseClips: THREE.AnimationClip[] = [];

    try {
      const gltf = await loader.loadAsync(basePath);
      model = gltf.scene;
      baseClips = gltf.animations;
    } catch (error) {
      console.warn(
        `[Player] Could not load "${basePath}". Using placeholder character.`,
        error
      );
      model = makePlaceholderModel();
    }

    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const bounds = new THREE.Box3().setFromObject(model);
    if (Number.isFinite(bounds.min.y)) {
      model.position.y -= bounds.min.y;
    }

    const optionalIdle = await loadOptional(
      loader,
      '/assets/characters/player_idle.glb',
      'idle animation'
    );
    const optionalWalk = await loadOptional(
      loader,
      '/assets/characters/player_walk.glb',
      'walk animation'
    );
    const optionalRun = await loadOptional(
      loader,
      '/assets/characters/player_run.glb',
      'run animation'
    );

    const clips: ClipSet = {
      idle:
        pickClipByKeywords(optionalIdle ?? [], ['idle']) ??
        pickClipByKeywords(baseClips, ['idle']),
      walk:
        pickClipByKeywords(optionalWalk ?? [], ['walk']) ??
        pickClipByKeywords(baseClips, ['walk']),
      run:
        pickClipByKeywords(optionalRun ?? [], ['run']) ??
        pickClipByKeywords(baseClips, ['run', 'sprint'])
    };

    if (!clips.idle && !clips.walk && !clips.run) {
      return new Player(model, null, {});
    }

    clips.idle = clips.idle ?? clips.walk ?? clips.run;
    clips.walk = clips.walk ?? clips.idle ?? clips.run;
    clips.run = clips.run ?? clips.walk ?? clips.idle;

    const mixer = new THREE.AnimationMixer(model);
    const actions: ActionSet = {};

    if (clips.idle) {
      actions.idle = mixer.clipAction(clips.idle);
    }
    if (clips.walk) {
      actions.walk = mixer.clipAction(clips.walk);
    }
    if (clips.run) {
      actions.run = mixer.clipAction(clips.run);
    }

    return new Player(model, mixer, actions);
  }

  setAnimation(nextState: PlayerAnimState): void {
    if (nextState === this.currentState) {
      return;
    }

    const nextAction =
      this.actions[nextState] ??
      this.actions.idle ??
      this.actions.walk ??
      this.actions.run;
    const currentAction = this.actions[this.currentState];

    if (!nextAction) {
      return;
    }

    if (currentAction && currentAction !== nextAction) {
      nextAction.reset();
      nextAction.play();
      nextAction.crossFadeFrom(currentAction, 0.2, true);
    } else if (!nextAction.isRunning()) {
      nextAction.reset();
      nextAction.play();
    }

    this.currentState = nextState;
  }

  update(deltaSeconds: number): void {
    this.mixer?.update(deltaSeconds);
  }
}
