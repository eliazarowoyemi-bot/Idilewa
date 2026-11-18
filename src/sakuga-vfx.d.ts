type SakugaElementAttributes = {
  children?: unknown;
  className?: string;
  disabled?: boolean;
  id?: string;
  label?: string;
  max?: number | string;
  min?: number | string;
  name?: string;
  onChange?: (event: Event) => void;
  onClick?: (event: Event) => void;
  onInput?: (event: Event) => void;
  step?: number | string;
  tabIndex?: number;
  type?: 'button' | 'submit' | 'reset';
  unit?: string;
  value?: number | string;
  variant?: 'secondary';
  checked?: boolean;
  [attribute: `aria-${string}`]: string | undefined;
  [attribute: `data-${string}`]: string | undefined;
};

declare global {
  interface SakugaButtonElement extends HTMLElement {
    disabled: boolean;
    done(hold?: number): void;
  }

  interface SakugaToggleElement extends HTMLElement {
    checked: boolean;
    disabled: boolean;
    value: string;
  }

  interface SakugaSliderElement extends HTMLElement {
    disabled: boolean;
    value: string;
    valueAsNumber: number;
  }

  interface HTMLElementTagNameMap {
    'sakuga-button': SakugaButtonElement;
    'sakuga-toggle': SakugaToggleElement;
    'sakuga-slider': SakugaSliderElement;
  }

  namespace JSX {
    interface IntrinsicElements {
      'sakuga-button': SakugaElementAttributes;
      'sakuga-toggle': SakugaElementAttributes;
      'sakuga-slider': SakugaElementAttributes;
    }
  }
}

export {};
