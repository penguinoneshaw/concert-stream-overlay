import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import {
  ConcertMetadata,
  Group,
  isPiece,
  Piece,
  SharedState,
} from "../../shared/interfaces";
import "./now_playing";

import DOMPurify from "dompurify";
import { marked } from "marked";

@customElement("streamer-presentation")
export class Presentation extends LitElement {
  @property({ reflect: true })
  public datetime: string | undefined;

  @property({ attribute: false, type: Object })
  public currentState: SharedState | undefined;

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

    .metadata {
      text-align: right;
    }
    .group-data {
      display: flex;
      flex-direction: column;
      text-align: center;
    }
    p {
      margin-bottom: 1rem;
    }

    h1,
    h2,
    h3,
    h4,
    h5 {
      margin: 3rem 0 1.38rem;
      font-family: var(--headings-font-stack);
      font-weight: 400;
      line-height: 1.3;
    }

    h1 {
      margin-top: 0;
      font-size: 3.052rem;
    }

    h2 {
      font-size: 2.441rem;
    }

    h3 {
      font-size: 1.953rem;
    }

    h4 {
      font-size: 1.563rem;
    }

    h5 {
      font-size: 1.25rem;
    }

    small,
    .text_small {
      font-size: 0.8rem;
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

  private renderGroup({ logo }: Group) {
    if (logo) {
      return html`<img src="${logo}" />`;
    } else return undefined;
  }

  render() {
    const logo = this.metadata?.group
      ? this.renderGroup(this.metadata.group)
      : "";

    const charity = Array.isArray(this.metadata?.charity)
      ? html`<span>
          Supporting:
          ${this.metadata?.charity
            .map(
              ({ name, registrationNumber }) =>
                `${name} (${registrationNumber})`
            )
            .join(", ")}
        </span>`
      : undefined;

    return html`
      <header>
        ${logo}
        <div class="group-data">${this.metadata?.group?.name} ${charity}</div>
        ${this.renderMetadata()}
      </header>

      ${isPiece(this.currentState)
        ? this.renderNowPlaying(this.currentState)
        : html`<h1>${this.currentState?.stream}</h1>`}
    `;
  }
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface HTMLElementTagNameMap {
    "streamer-presentation": Presentation;
  }
}
