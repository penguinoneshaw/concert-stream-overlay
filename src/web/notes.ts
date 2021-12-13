import DOMPurify from "dompurify";
import { html, render } from "lit";
import { marked } from "marked";
import { Concert, isPiece, OtherState, Piece } from "../shared/interfaces";

async function updateState(v: string | number) {
  fetch("/state", {
    body: JSON.stringify({ newState: v }),
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}

const renderPieceNotes = ({
  title,
  subtitle,
  arranger,
  composer,
  notes,
}: Piece) => html`
  <article>
    <header>
      <h1>${title} ${subtitle != null ? `(${subtitle})` : subtitle}</h1>
      <h2>${composer} ${arranger != null ? `arr. ${arranger}` : undefined}</h2>
      <button @click=${() => updateState(title)}>Set State</button>
    </header>
    <section
      .innerHTML="${marked.parse(DOMPurify.sanitize(notes as string), {
        smartypants: true,
      })}"
    ></section>
  </article>
`;

(async () => {
  const metadataFetch = await fetch("/metadata");

  if (metadataFetch.ok) {
    const metadata: Concert = await metadataFetch.json();
    const generalElements = html`<nav>
      ${metadata.running_order
        .filter<OtherState>(function (v): v is OtherState {
          return v.type != null && v.type !== "piece";
        })
        .map(
          ({ type, controls, stream }: OtherState) =>
            html`<button @click=${async () => await updateState(type)}>
              ${controls ?? stream ?? type}
            </button>`
        )}
    </nav>`;

    const metaElements = metadata.running_order
      .filter<Piece>(isPiece)
      .map(renderPieceNotes);

    render([generalElements].concat(metaElements), document.body);
  }
})();
