import { LitElement, html, TemplateResult, css, CSSResultGroup } from "lit";
import { customElement, state } from "lit/decorators.js";
import { ifDefined } from "lit/directives/if-defined.js";

import { when } from "lit/directives/when.js";
import { Subscription } from "rxjs";
import { Concert } from "../shared/interfaces";
import { fullConcertDataSubject } from "./store";

import { stringify } from "yaml";

@customElement("streamer-configurator")
export class Configurator extends LitElement {
  static styles?: CSSResultGroup | undefined = css`
    :host {
      display: block;
    }
  `;

  @state()
  private _originalState?: Concert;

  private _subscriptions: Subscription[] = [];

  connectedCallback(): void {
    super.connectedCallback();
    fullConcertDataSubject.subscribe((v) => (this._originalState = v));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._subscriptions.forEach((sub) => sub.unsubscribe());
    this._subscriptions = [];
  }

  public render(): TemplateResult {
    return html`
      ${when(
        this._originalState != null,
        () =>
          html`<form
              @submit=${(e: Event) => {
                e.preventDefault();

                console.log(e);
              }}
            >
              <fieldset name="metadata">
                <legend>Metadata</legend>
                <label for="metadata-name">Name</label
                ><input
                  id="metadata-name"
                  type="text"
                  value=${ifDefined(this._originalState?.name)}
                />
                <label for="metadata-date">Date</label
                ><input
                  id="metadata-date"
                  type="datetime-local"
                  value=${typeof this._originalState?.date === "string"
                    ? new Date(this._originalState.date)
                        ?.toISOString()
                        .split(/[Z]/gim)[0]
                    : this._originalState?.date
                        ?.toISOString()
                        .split(/[Z]/gim)[0] ??
                      new Date().toISOString().split(/[Z]/gim)[0]}
                />
                ${this._originalState?.charity?.map(
                  (charity, i) => html`
                    <fieldset name="charity-${i}">
                      <legend>Charity</legend>
                      <label for="metadata-charity-${i}-name">Name</label
                      ><input
                        id="metadata-charity-${i}-name"
                        type="text"
                        value=${charity.name}
                      />
                      <label for="metadata-charity-${i}-reg-no">Name</label
                      ><input
                        id="metadata-charity-${i}-reg-no"
                        type="text"
                        value=${charity.registrationNumber}
                        pattern="SCO[0-9]+"
                      />
                    </fieldset>
                  `
                )}
              </fieldset>
            </form>
            <code class="language-yaml">
              <pre>
${stringify(this._originalState, {})}
              </pre
              >
            </code> `,
        () => html`<div><p>Data currently unloaded.</p></div>`
      )}
    `;
  }
}

declare global {
  // eslint-disable-next-line no-unused-vars
  interface HTMLElementTagNameMap {
    "streamer-configurator": Configurator;
  }
}
