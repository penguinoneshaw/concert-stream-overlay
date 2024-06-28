import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Piece } from "../../shared/interfaces";

@customElement("overlay-nowplaying")
export class NowPlaying extends LitElement {
  @property({ attribute: false, type: Object })
  public currentState: Piece | undefined;

  static styles = css`
    :host {
      overflow: hidden;
      text-align: center;
      display: inline-flex;
      flex-direction: column;
      font-family: var(--font-stack);
    }
    .title {
      font-size: 1.5em;
      font-family: var(--headings-font-stack);
      font-weight: 700;
    }
  `;

  public render() {
    if (!this.currentState) return undefined;

    const { title, subtitle, composer, arranger } = this.currentState;

    return html`<span class="title">
        ${title} ${subtitle != null ? `(${subtitle})` : subtitle}
      </span>
      <span>
        ${composer} ${arranger != null ? `arr. ${arranger}` : undefined}
      </span>`;
  }
}
