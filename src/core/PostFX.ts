import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

type PostFXOptions = {
  enableSAO?: boolean;
};

export class PostFX {
  readonly composer: EffectComposer;

  private readonly saoPass: SAOPass | null;
  private readonly bloomPass: UnrealBloomPass;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    options: PostFXOptions = {}
  ) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;

    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    if (options.enableSAO === true) {
      const saoPass = new SAOPass(scene, camera, false, true);
      saoPass.params.saoIntensity = 0.008;
      saoPass.params.saoScale = 2.2;
      saoPass.params.saoKernelRadius = 26;
      saoPass.params.saoBlurStdDev = 3;
      this.composer.addPass(saoPass);
      this.saoPass = saoPass;
    } else {
      this.saoPass = null;
    }

    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.35,
      0.55,
      0.9
    );
    this.composer.addPass(this.bloomPass);
  }

  render(): void {
    this.composer.render();
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
    this.saoPass?.setSize(width, height);
  }
}
