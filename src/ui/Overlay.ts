export class Overlay {
  private readonly root: HTMLDivElement;
  private readonly audioChip: HTMLDivElement;
  private readonly modeChip: HTMLDivElement;
  private readonly compassNeedle: HTMLDivElement;
  private readonly hints: HTMLDivElement;
  private readonly enterScreen: HTMLDivElement;

  private enterHandler: (() => void) | null = null;
  private hintsTimer = 0;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'overlay-root';

    const panel = document.createElement('div');
    panel.className = 'overlay-card';

    const title = document.createElement('div');
    title.className = 'overlay-title';
    title.textContent = 'Jungle Ruins Playground';

    const subtitle = document.createElement('div');
    subtitle.className = 'overlay-subtitle';
    subtitle.textContent = 'Explore the jungle camp and ancient steps';

    const chips = document.createElement('div');
    chips.className = 'overlay-chips';

    this.audioChip = document.createElement('div');
    this.audioChip.className = 'overlay-chip';
    this.audioChip.textContent = 'Audio OFF';

    this.modeChip = document.createElement('div');
    this.modeChip.className = 'overlay-chip';
    this.modeChip.textContent = 'Mode: Explore';

    chips.append(this.audioChip, this.modeChip);

    const compass = document.createElement('div');
    compass.className = 'overlay-compass';
    compass.innerHTML =
      '<span class="compass-n">N</span><span class="compass-e">E</span><span class="compass-s">S</span><span class="compass-w">W</span>';

    this.compassNeedle = document.createElement('div');
    this.compassNeedle.className = 'overlay-compass-needle';
    compass.appendChild(this.compassNeedle);

    this.hints = document.createElement('div');
    this.hints.className = 'overlay-hints';
    this.hints.innerHTML =
      '<div>WASD move • Shift run • Mouse look</div><div>Click to capture pointer • C debug camera</div>';

    panel.append(title, subtitle, chips, compass, this.hints);

    this.enterScreen = document.createElement('div');
    this.enterScreen.className = 'enter-screen';
    this.enterScreen.innerHTML =
      '<div class="enter-card"><h1>Jungle Ruins Playground</h1><p>Click to enter</p></div>';
    this.enterScreen.addEventListener('click', () => {
      this.enterHandler?.();
    });

    this.root.append(panel, this.enterScreen);
    document.body.appendChild(this.root);
  }

  onEnterRequest(handler: () => void): void {
    this.enterHandler = handler;
  }

  setAudioEnabled(enabled: boolean): void {
    this.audioChip.textContent = enabled ? 'Audio ON' : 'Audio OFF';
  }

  setMode(mode: 'Explore' | 'Debug'): void {
    this.modeChip.textContent = `Mode: ${mode}`;
  }

  setCompassYaw(yaw: number): void {
    this.compassNeedle.style.transform = `translate(-50%, -100%) rotate(${(-yaw * 180) / Math.PI}deg)`;
  }

  setEnterVisible(visible: boolean): void {
    this.enterScreen.style.display = visible ? 'flex' : 'none';
  }

  fadeHintsAfter(delayMs: number): void {
    if (this.hintsTimer !== 0) {
      window.clearTimeout(this.hintsTimer);
    }

    this.hints.classList.remove('is-faded');
    this.hintsTimer = window.setTimeout(() => {
      this.hints.classList.add('is-faded');
    }, delayMs);
  }
}
