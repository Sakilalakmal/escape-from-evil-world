export type ObjectiveId = 'campfire' | 'dancers' | 'stairs';

export type ObjectiveDefinition = {
  id: ObjectiveId;
  label: string;
};

export class Objectives {
  readonly element: HTMLUListElement;

  private readonly items = new Map<ObjectiveId, HTMLLIElement>();
  private readonly states = new Map<ObjectiveId, boolean>();

  constructor(definitions: ObjectiveDefinition[]) {
    this.element = document.createElement('ul');
    this.element.className = 'hud-objectives';

    for (const definition of definitions) {
      const item = document.createElement('li');
      item.className = 'hud-objective';
      item.textContent = definition.label;
      this.items.set(definition.id, item);
      this.states.set(definition.id, false);
      this.element.appendChild(item);
    }
  }

  setCompleted(id: ObjectiveId, completed: boolean): void {
    const item = this.items.get(id);
    if (!item) {
      return;
    }

    this.states.set(id, completed);
    item.classList.toggle('is-complete', completed);
  }

  isCompleted(id: ObjectiveId): boolean {
    return this.states.get(id) ?? false;
  }
}
