import { IntroScreen } from './IntroScreen';
import { Objectives, type ObjectiveId } from './Objectives';

export class Overlay {
  private readonly root: HTMLDivElement;
  private readonly intro: IntroScreen;
  private readonly hudPanel: HTMLDivElement;
  private readonly audioIndicator: HTMLSpanElement;
  private readonly compassNeedle: HTMLDivElement;
  private readonly contextPrompt: HTMLDivElement;
  private readonly pointerHint: HTMLDivElement;
  private readonly fadeCurtain: HTMLDivElement;
  private readonly objectives: Objectives;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'overlay-root';

    this.intro = new IntroScreen();

    this.hudPanel = document.createElement('div');
    this.hudPanel.className = 'hud-panel';
    this.hudPanel.innerHTML = `
      <div class="hud-title">Field Overlay</div>
      <div class="hud-controls">WASD move • Shift run • Space jump • Tab toggle HUD</div>
      <div class="hud-row">
        <span class="hud-audio">Audio: <strong>OFF</strong></span>
      </div>
      <div class="hud-compass">
        <span class="compass-n">N</span>
        <span class="compass-e">E</span>
        <span class="compass-s">S</span>
        <span class="compass-w">W</span>
      </div>
    `;

    const audioStrong = this.hudPanel.querySelector<HTMLSpanElement>('.hud-audio strong');
    if (!audioStrong) {
      throw new Error('Missing HUD audio indicator.');
    }
    this.audioIndicator = audioStrong;

    const compass = this.hudPanel.querySelector<HTMLDivElement>('.hud-compass');
    if (!compass) {
      throw new Error('Missing HUD compass.');
    }
    this.compassNeedle = document.createElement('div');
    this.compassNeedle.className = 'hud-compass-needle';
    compass.appendChild(this.compassNeedle);

    this.objectives = new Objectives([
      { id: 'campfire', label: 'Reach the Campfire' },
      { id: 'dancers', label: 'Meet the Dancers' },
      { id: 'stairs', label: 'Climb the Ancient Steps' }
    ]);
    this.hudPanel.appendChild(this.objectives.element);

    this.contextPrompt = document.createElement('div');
    this.contextPrompt.className = 'context-prompt';

    this.pointerHint = document.createElement('div');
    this.pointerHint.className = 'pointer-hint';
    this.pointerHint.textContent = 'Click to recapture mouse look';

    this.fadeCurtain = document.createElement('div');
    this.fadeCurtain.className = 'fade-curtain';

    this.root.append(
      this.hudPanel,
      this.contextPrompt,
      this.pointerHint,
      this.fadeCurtain,
      this.intro.element
    );
    document.body.appendChild(this.root);
  }

  onEnterRequest(handler: () => void): void {
    this.intro.onEnterRequest(handler);
  }

  hideIntro(): void {
    this.intro.hide();
  }

  setHudVisible(visible: boolean): void {
    this.hudPanel.classList.toggle('is-hidden', !visible);
  }

  setAudioEnabled(enabled: boolean): void {
    this.audioIndicator.textContent = enabled ? 'ON' : 'OFF';
  }

  setCompassYaw(yaw: number): void {
    this.compassNeedle.style.transform = `translate(-50%, -100%) rotate(${(-yaw * 180) / Math.PI}deg)`;
  }

  setObjectiveCompleted(id: ObjectiveId, completed: boolean): void {
    this.objectives.setCompleted(id, completed);
  }

  setContextPrompt(text: string | null): void {
    this.contextPrompt.textContent = text ?? '';
    this.contextPrompt.classList.toggle('is-visible', text !== null);
  }

  setPointerHintVisible(visible: boolean): void {
    this.pointerHint.classList.toggle('is-visible', visible);
  }

  fadeFromBlack(durationMs = 800): void {
    this.fadeCurtain.style.transitionDuration = `${durationMs}ms`;
    this.fadeCurtain.classList.add('is-visible');

    window.setTimeout(() => {
      this.fadeCurtain.classList.remove('is-visible');
    }, 20);
  }
}
