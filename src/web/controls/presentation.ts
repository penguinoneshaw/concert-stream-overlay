import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import {
  ConcertMetadata,
  Group,
  isPiece,
  Piece,
  PieceOrOtherState,
} from "../../shared/interfaces";
import "./now_playing";

import DOMPurify from "dompurify";
import { marked } from "marked";

@customElement("streamer-presentation")
export class Presentation extends LitElement {
  @property({ reflect: true })
  public datetime: string | undefined;

  @property({ attribute: false, type: Object })
  public currentState: PieceOrOtherState | undefined;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      max-height: 100vh;
      max-width: 100vw;
      align-items: stretch;
      justify-content: space-between;
      padding: 1ex 1em;

      background-color: var(--background-colour, forestgreen);
      color: var(--highlight-colour, white);
      font-family: var(--font-stack);
    }

    img {
      height: 100%;
    }

    overlay-nowplaying {
      flex-grow: 1;
    }

    .metadata {
      text-align: right;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 10vh;
    }

    .lyrics {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      gap: 1ex;
    }
    .lyrics p {
      counter-increment: v;
    }
    .lyrics p::before {
      content: counter(v) ") ";
    }
  `;

  @property({ reflect: true, type: Object })
  public metadata?: Partial<ConcertMetadata>;

  public renderMetadata = () =>
    this.metadata != null
      ? html`<div class="metadata">
          <div>${this.metadata.name ?? ""}</div>
          <time
            datetime="${ifDefined(
              this.metadata?.date != null
                ? new Date(this.metadata?.date).toISOString()
                : undefined
            )}"
          >
            ${this.metadata.date != null
              ? new Date(this.metadata.date).toLocaleDateString(undefined, {
                  dateStyle: "long",
                })
              : ""}
          </time>
        </div>`
      : "";

  private renderNowPlaying(currentState: Piece) {
    const { title, subtitle, composer, arranger, lyrics } = currentState;

    return html`
      ${lyrics != null
        ? html`<section
            class="lyrics"
            .innerHTML="${DOMPurify.sanitize(
              marked.parse(lyrics, {
                smartypants: true,
                sanitizer: DOMPurify.sanitize,
              })
            )}"
          ></section>`
        : undefined}
      <section>
        <h1 class="title">
          ${title} ${subtitle != null ? `(${subtitle})` : subtitle}
        </h1>
        <h2>
          ${composer} ${arranger != null ? `arr. ${arranger}` : undefined}
        </h2>
      </section>
    `;
  }

  private renderGroup(group: Group) {
    if (group.logo) {
      return html`<img src="${group.logo}" />`;
    } else return group.name;
  }

  render() {
    const logo = this.metadata?.group
      ? this.renderGroup(this.metadata.group)
      : "";

    return html`
      <header>${logo} ${this.renderMetadata()}</header>
      ${isPiece(this.currentState)
        ? this.renderNowPlaying(this.currentState)
        : this.currentState?.stream}
    `;
  }
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface HTMLElementTagNameMap {
    "streamer-presentation": Presentation;
  }
}
