import DOMPurify from "dompurify";
import { html, render } from "lit";
import { marked } from "marked";
import {
  Concert,
  OtherState,
  SharedState,
  isPiece,
} from "../shared/interfaces";

import "./controls/presentation";

async function updateState(v: string | number) {
  fetch("/state", {
    body: JSON.stringify({ newState: v }),
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}
function isOtherState(v: SharedState): v is OtherState {
  return v.type != null && v.type !== "piece";
}
const renderPieceNotes = ({ notes, ...piece }: SharedState) => html`
  <article>
    <header>
      ${isPiece(piece)
        ? html` <streamer-title-block
            .arranger=${piece.arranger}
            .composer=${piece.composer}
            .lyricist=${piece.lyricist}
            .subtitle=${piece.subtitle}
            .title=${piece.title}
            .transcriber=${piece.transcriber}
          ></streamer-title-block>`
        : isOtherState(piece)
        ? html`<h1>${piece.stream ?? piece.type}</h1>`
        : html`<h1>${piece.type}</h1>`}
    </header>

    <nav>
      <button
        @click=${() => {
          const newState = isPiece(piece) ? piece.title : piece.type;
          if (newState) updateState(newState);
        }}
      >
        Set State
      </button>
    </nav>
    ${notes
      ? html`<section
          .innerHTML="${marked.parseInline(
            DOMPurify.sanitize(notes as string),
            {
              async: false,
            }
          )}"
        ></section>`
      : undefined}
  </article>
`;

(async () => {
  const metadataFetch = await fetch("/metadata");

  if (metadataFetch.ok) {
    const metadata: Concert = await metadataFetch.json();
    const generalElements = html`<nav>
      ${metadata.running_order
        .filter<OtherState>(isOtherState)
        .map(
          ({ type, controls, stream }: OtherState) =>
            html`<button @click=${async () => await updateState(type)}>
              ${controls ?? stream ?? type}
            </button>`
        )}
    </nav>`;

    const metaElements = metadata.running_order.map(renderPieceNotes);

    render([generalElements].concat(metaElements), document.body);
  }
})();
