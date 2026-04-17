export abstract class Component {
  protected el: HTMLElement;

  constructor(tag: string = 'div', className?: string) {
    this.el = document.createElement(tag);
    if (className) this.el.className = className;
  }

  /** Returns the root element for mounting */
  getElement(): HTMLElement {
    return this.el;
  }

  /** Clean up event listeners, observers, etc. */
  destroy(): void {}
}
