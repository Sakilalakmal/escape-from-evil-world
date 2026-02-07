type EnterHandler = () => void;

export class IntroScreen {
  readonly element: HTMLDivElement;

  private enterHandler: EnterHandler | null = null;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'intro-screen';
    this.element.innerHTML = `
      <div class="intro-content">
        <h1>Jungle Ruins Playground</h1>
        <p>Step into the ruins. Find the fire. Climb the ancient stairs.</p>
        <button type="button">Enter</button>
      </div>
    `;

    const button = this.element.querySelector('button');
    if (!button) {
      throw new Error('Intro screen button not found.');
    }

    button.addEventListener('click', () => {
      this.enterHandler?.();
    });
  }

  onEnterRequest(handler: EnterHandler): void {
    this.enterHandler = handler;
  }

  hide(): void {
    this.element.classList.add('is-hidden');
  }

  show(): void {
    this.element.classList.remove('is-hidden');
  }
}
