import { CSSResultGroup, LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { repeat } from "lit/directives/repeat.js";
import {
  ConcertMetadata,
  Group,
  Piece,
  SharedState,
  isPiece,
} from "../../shared/interfaces";
import { metadataSubject, obsStateSubject, stateSubject } from "../store";
import "./now_playing";

import DOMPurify from "dompurify";
import { marked } from "marked";
import { Subscription } from "rxjs";
import { Task } from "@lit/task";
const sharedStyles = css`
  :host {
    color: var(--highlight-colour, white);
    font-family: var(--font-stack);
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
`;

@customElement("presentation-state-information-slide")
export class StateInformationSlide extends LitElement {
  static styles?: CSSResultGroup | undefined = css`
    ${sharedStyles}

    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
      text-align: center;
    }
  `;

  protected render(): unknown {
    return html`<slot></slot>`;
  }
}

@customElement("streamer-title-block")
export class TitleBlock extends LitElement {
  static styles?: CSSResultGroup | undefined = css`
    :host {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    h1,
    h2,
    h3,
    .subtitle {
      margin-bottom: 1rem !important;
      margin-top: 0 !important;
    }
    section {
      font-size: 1.2em;
    }
    .subtitle {
      font-family: var(--headings-font-stack);
      font-size: 1.4rem;
      display: inline-block;
    }

    header {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }

    [key="composer"] {
      font-style: italic;
    }
    dl {
      display: grid;

      grid-template-columns: auto 1fr;
    }
    dd {
      font-style: italic;
    }

    ${sharedStyles}
  `;

  @property({ reflect: true })
  title: string = "";

  @property({ reflect: true })
  subtitle?: string;

  @property({ reflect: true })
  composer?: string;

  @property({ reflect: true })
  arranger?: string;

  @property({ reflect: true })
  lyricist?: string;

  @property({ reflect: true })
  transcriber?: string;

  protected render(): unknown {
    return html`
      <header>
        <h1 class="title">${this.title}</h1>
        ${this.subtitle != null
          ? html`<span class="subtitle">${this.subtitle}</span>`
          : this.subtitle}
        <h2 key="composer">${this.composer}</h2>
      </header>
      <dl>
        ${repeat(
          (["arranger", "transcriber", "lyricist"] as const).filter(
            (person) => this[person] != null
          ),
          (v) => v,
          (person) =>
            html`<dt>
                ${person.slice(0, 1).toLocaleUpperCase() + person.slice(1)}
              </dt>
              <dd key=${person}>${this[person]}</dd>`
        )}
      </dl>
    `;
  }
}

@customElement("streamer-presentation")
export class Presentation extends LitElement {
  @property({ reflect: true })
  public datetime: string | undefined;

  @property({ attribute: false, type: Object })
  public currentState: SharedState | undefined;

  private subscriptions: Subscription[] = [];

  private live: boolean = false;

  connectedCallback(): void {
    super.connectedCallback();
    this.subscriptions.push(
      stateSubject.subscribe((v) => {
        this.currentState = v;
      }),

      metadataSubject.subscribe((v) => {
        this.metadata = v;
      }),

      obsStateSubject.subscribe((v) => {
        this.live = v?.streaming ?? false;
      })
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }

    this.subscriptions = [];
  }

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

    ${sharedStyles}

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

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 10vh;
      padding: 1em 0;
      border-top: thick white solid;
    }

    presentation-state-information-slide,
    streamer-title-block {
      height: 100%;
    }

    .lyrics {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      gap: 1ex;
      font-size: 1.3em;
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
          ${this.live === true ? html`<div>Live!</div>` : undefined}
        </div>`
      : "";

  private lyricsRender = new Task<
    readonly [string | undefined],
    string | undefined
  >(this, {
    task: async ([lyrics]: readonly [string | undefined]) => {
      return lyrics
        ? DOMPurify.sanitize(await marked.parse(lyrics, { async: true }))
        : undefined;
    },
    args: () =>
      [
        this.currentState?.type === "piece"
          ? this.currentState.lyricist
          : undefined,
      ] as const,
  });

  private renderNowPlaying(currentState: Piece) {
    const { title, subtitle, composer, arranger, lyricist, transcriber } =
      currentState;

    return html`
      <streamer-title-block
        .title=${title}
        subtitle=${ifDefined(subtitle)}
        arranger=${ifDefined(arranger)}
        composer=${ifDefined(composer)}
        lyricist=${ifDefined(lyricist)}
        transcriber=${ifDefined(transcriber)}
      >
      </streamer-title-block>
      ${this.lyricsRender.render({
        complete: (lyrics) =>
          html`${lyrics != null
            ? html`<section class="lyrics" .innerHTML=${lyrics}></section>`
            : undefined}`,
      })}
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
      ${isPiece(this.currentState)
        ? this.renderNowPlaying(this.currentState)
        : html`<presentation-state-information-slide>
            <h1>${this.currentState?.stream}</h1>
          </presentation-state-information-slide>`}
      <header>
        ${logo}
        <div class="group-data">${this.metadata?.group?.name} ${charity}</div>
        ${this.renderMetadata()}
      </header>
    `;
  }
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface HTMLElementTagNameMap {
    "streamer-presentation": Presentation;
    "streamer-title-block": TitleBlock;
  }
}
