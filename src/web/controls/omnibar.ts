import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";
import { Subscription } from "rxjs";
import {
  ConcertMetadata,
  Group,
  isPiece,
  Piece,
  SharedState,
} from "../../shared/interfaces";
import { metadataSubject, stateSubject } from "../store";
import "./now_playing";

@customElement("streamer-omnibar")
export class OmniBar extends LitElement {
  @property({ reflect: true })
  public datetime: string | undefined;

  @property({ attribute: false, type: Object })
  public currentState: SharedState | undefined;

  static styles = css`
    :host {
      display: flex;
      width: 100%;
      height: 15%;
      max-height: 100px;
      align-items: center;
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
      font-family: var(--headings-font-stack);

      text-align: right;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-family: var(--headings-font-stack);
    }
  `;

  private subscriptions: Subscription[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    this.subscriptions.push(
      stateSubject.subscribe((v) => {
        this.currentState = v;
      }),

      metadataSubject.subscribe((v) => {
        this.metadata = v;
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
    return html`
      <overlay-nowplaying .currentState="${currentState}"></overlay-nowplaying>
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
      ${logo}
      ${isPiece(this.currentState)
        ? this.renderNowPlaying(this.currentState)
        : html`<h1>${this.currentState?.stream}</h1>`}
      ${this.renderMetadata()}
    `;
  }
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface HTMLElementTagNameMap {
    "streamer-omnibar": OmniBar;
  }
}
