export class HUD {
  private readonly root: HTMLDivElement;
  private readonly audioStatus: HTMLDivElement;
  private readonly audioHint: HTMLDivElement;

  constructor() {
    this.root = document.createElement('div');
    this.root.className = 'hud';

    const lineOne = document.createElement('div');
    lineOne.className = 'hud-line';
    lineOne.textContent = 'WASD move • Shift run • C camera';

    const lineTwo = document.createElement('div');
    lineTwo.className = 'hud-line';
    lineTwo.textContent = 'Go near dancers for music';

    this.audioStatus = document.createElement('div');
    this.audioStatus.className = 'hud-line hud-audio';
    this.audioStatus.textContent = 'Audio: OFF';

    this.audioHint = document.createElement('div');
    this.audioHint.className = 'hud-audio-hint';
    this.audioHint.textContent = 'Click to enable sound';

    this.root.append(lineOne, lineTwo, this.audioStatus, this.audioHint);
    document.body.appendChild(this.root);
  }

  setAudioEnabled(enabled: boolean): void {
    this.audioStatus.textContent = enabled ? 'Audio: ON' : 'Audio: OFF';
    this.audioHint.style.display = enabled ? 'none' : 'block';
  }
}
