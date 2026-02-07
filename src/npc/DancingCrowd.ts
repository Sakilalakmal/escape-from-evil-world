import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

function pickClip(
  clips: THREE.AnimationClip[],
  keywords: string[]
): THREE.AnimationClip | null {
  const lowercaseKeywords = keywords.map((keyword) => keyword.toLowerCase());

  for (const clip of clips) {
    const clipName = clip.name.toLowerCase();
    if (lowercaseKeywords.some((keyword) => clipName.includes(keyword))) {
      return clip;
    }
  }

  return clips[0] ?? null;
}

function createNpcPlaceholder(): THREE.Group {
  const npc = new THREE.Group();

  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.45, 1.6, 8),
    new THREE.MeshStandardMaterial({ color: 0x8f8b7d, roughness: 0.9 })
  );
  torso.position.y = 1.1;
  torso.castShadow = true;
  torso.receiveShadow = true;
  npc.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xa9a48f, roughness: 0.82 })
  );
  head.position.y = 2.2;
  head.castShadow = true;
  head.receiveShadow = true;
  npc.add(head);

  return npc;
}

async function loadOptionalDanceClips(
  loader: GLTFLoader
): Promise<THREE.AnimationClip[] | null> {
  const path = '/assets/characters/npc_dance.glb';

  try {
    const gltf = await loader.loadAsync(path);
    return gltf.animations;
  } catch (error) {
    console.warn(`[DancingCrowd] Missing optional dance file "${path}".`, error);
    return null;
  }
}

export class DancingCrowd {
  readonly group = new THREE.Group();
  readonly zoneAnchor = new THREE.Object3D();
  readonly zoneCenter: THREE.Vector3;

  private readonly mixers: THREE.AnimationMixer[] = [];
  private readonly count: number;

  constructor(zoneCenter: THREE.Vector3, count = 9) {
    this.zoneCenter = zoneCenter.clone();
    this.count = Math.min(Math.max(count, 6), 12);
    this.group.name = 'DanceZoneCrowd';
    this.zoneAnchor.position.copy(this.zoneCenter).setY(1.5);
  }

  async load(): Promise<void> {
    const loader = new GLTFLoader();
    const npcPath = '/assets/characters/npc.glb';

    let baseModel: THREE.Object3D;
    let baseAnimations: THREE.AnimationClip[] = [];

    try {
      const gltf = await loader.loadAsync(npcPath);
      baseModel = gltf.scene;
      baseAnimations = gltf.animations;
    } catch (error) {
      console.warn(
        `[DancingCrowd] Could not load "${npcPath}". Using placeholder NPCs.`,
        error
      );
      baseModel = createNpcPlaceholder();
    }

    baseModel.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const baseBounds = new THREE.Box3().setFromObject(baseModel);
    if (Number.isFinite(baseBounds.min.y)) {
      baseModel.position.y -= baseBounds.min.y;
    }

    const danceAnimations = await loadOptionalDanceClips(loader);
    const danceClip =
      pickClip(danceAnimations ?? [], ['dance']) ??
      pickClip(baseAnimations, ['dance', 'groove']) ??
      pickClip(baseAnimations, []);

    if (!danceClip) {
      console.warn('[DancingCrowd] No dance animation found. NPCs will stay static.');
    }

    for (let index = 0; index < this.count; index += 1) {
      const npc = clone(baseModel);
      npc.position.copy(this.getNpcPosition(index));
      npc.lookAt(this.zoneCenter.x, npc.position.y, this.zoneCenter.z);
      this.group.add(npc);

      if (!danceClip) {
        continue;
      }

      const mixer = new THREE.AnimationMixer(npc);
      const action = mixer.clipAction(danceClip);
      action.play();
      action.time = Math.random() * Math.max(danceClip.duration, 0.01);
      action.setEffectiveTimeScale(0.9 + Math.random() * 0.25);
      this.mixers.push(mixer);
    }
  }

  update(deltaSeconds: number): void {
    for (const mixer of this.mixers) {
      mixer.update(deltaSeconds);
    }
  }

  private getNpcPosition(index: number): THREE.Vector3 {
    const arc = Math.PI * 0.9;
    const start = -Math.PI * 0.75;
    const angle = start + (arc * index) / Math.max(this.count - 1, 1);
    const radius = 6.5 + Math.random() * 2.2;

    return new THREE.Vector3(
      this.zoneCenter.x + Math.cos(angle) * radius + (Math.random() - 0.5) * 0.8,
      0,
      this.zoneCenter.z + Math.sin(angle) * radius + (Math.random() - 0.5) * 0.8
    );
  }
}
