import * as THREE from 'three';
import type { MovementState } from '../player/CharacterController';

type AudioStateListener = (enabled: boolean) => void;

export class AudioManager {
  private readonly listener = new THREE.AudioListener();
  private readonly loader = new THREE.AudioLoader();
  private readonly zonePosition = new THREE.Vector3();

  private ambient: THREE.Audio | null = null;
  private danceMusic: THREE.PositionalAudio | null = null;
  private footsteps: THREE.Audio | null = null;

  private isEnabled = false;
  private stepTimer = 0;
  private onStateChange: AudioStateListener | null = null;

  private readonly unlockAudio = (): void => {
    void this.enableAudio();
  };

  constructor(
    camera: THREE.Camera,
    private readonly danceZoneAnchor: THREE.Object3D
  ) {
    camera.add(this.listener);
  }

  async load(): Promise<void> {
    const [ambientBuffer, danceBuffer, footstepBuffer] = await Promise.all([
      this.loadBuffer('/assets/audio/ambient_jungle.mp3', 'ambient jungle'),
      this.loadBuffer('/assets/audio/dance_zone.mp3', 'dance zone'),
      this.loadBuffer('/assets/audio/footstep.mp3', 'footstep')
    ]);

    if (ambientBuffer) {
      this.ambient = new THREE.Audio(this.listener);
      this.ambient.setBuffer(ambientBuffer);
      this.ambient.setLoop(true);
      this.ambient.setVolume(0.45);
    }

    if (danceBuffer) {
      this.danceMusic = new THREE.PositionalAudio(this.listener);
      this.danceMusic.setBuffer(danceBuffer);
      this.danceMusic.setLoop(true);
      this.danceMusic.setRefDistance(10);
      this.danceMusic.setRolloffFactor(1.5);
      this.danceMusic.setDistanceModel('exponential');
      this.danceMusic.setMaxDistance(95);
      this.danceMusic.setVolume(0.15);
      this.danceZoneAnchor.add(this.danceMusic);
    }

    if (footstepBuffer) {
      this.footsteps = new THREE.Audio(this.listener);
      this.footsteps.setBuffer(footstepBuffer);
      this.footsteps.setLoop(false);
      this.footsteps.setVolume(0.3);
    }

    window.addEventListener('pointerdown', this.unlockAudio);
    window.addEventListener('keydown', this.unlockAudio);
    window.addEventListener('touchstart', this.unlockAudio);
  }

  setAudioStateListener(listener: AudioStateListener): void {
    this.onStateChange = listener;
    this.onStateChange(this.isEnabled);
  }

  async enableAudio(): Promise<void> {
    if (this.isEnabled) {
      return;
    }

    try {
      await this.listener.context.resume();
    } catch (error) {
      console.warn('[AudioManager] Failed to resume audio context.', error);
      return;
    }

    this.isEnabled = true;

    if (this.ambient && !this.ambient.isPlaying) {
      this.ambient.play();
    }
    if (this.danceMusic && !this.danceMusic.isPlaying) {
      this.danceMusic.play();
    }

    window.removeEventListener('pointerdown', this.unlockAudio);
    window.removeEventListener('keydown', this.unlockAudio);
    window.removeEventListener('touchstart', this.unlockAudio);

    this.onStateChange?.(this.isEnabled);
  }

  update(
    deltaSeconds: number,
    movement: MovementState,
    playerPosition: THREE.Vector3
  ): void {
    if (!this.isEnabled) {
      return;
    }

    if (this.danceMusic) {
      this.danceZoneAnchor.getWorldPosition(this.zonePosition);
      const distance = this.zonePosition.distanceTo(playerPosition);
      const proximity = THREE.MathUtils.clamp(1 - distance / 55, 0, 1);
      this.danceMusic.setVolume(0.15 + proximity * 0.85);
    }

    if (!this.footsteps) {
      return;
    }

    if (!movement.moving) {
      this.stepTimer = 0;
      if (this.footsteps.isPlaying) {
        this.footsteps.stop();
      }
      return;
    }

    this.stepTimer += deltaSeconds;
    const interval = movement.running ? 0.27 : 0.44;

    if (this.stepTimer >= interval) {
      this.stepTimer = 0;
      if (this.footsteps.isPlaying) {
        this.footsteps.stop();
      }
      this.footsteps.play();
    }
  }

  private async loadBuffer(
    path: string,
    label: string
  ): Promise<AudioBuffer | null> {
    try {
      return await this.loader.loadAsync(path);
    } catch (error) {
      console.warn(`[AudioManager] Missing ${label} audio "${path}".`, error);
      return null;
    }
  }
}
