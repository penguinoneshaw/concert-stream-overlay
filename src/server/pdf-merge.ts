import { readdir, writeFile } from "fs/promises";
import { join } from "path";
import PDFMerger from "pdf-merger-js";
import { launch, PDFOptions } from "puppeteer";

export async function generateNotesPDF(url: string) {
  const browser = await launch({ headless: true });

  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle0" });

  const pdfOptions: PDFOptions = {
    format: "a4",
    headerTemplate: undefined,
    printBackground: true,
    margin: {
      top: "1.5cm",
      bottom: "1.5cm",
    },
    displayHeaderFooter: false,
  };

  const notesPDF = await page.pdf(pdfOptions);

  const notesFile = join("../data/Music", "notes.pdf");

  await writeFile(notesFile, notesPDF);

  const pdfMerger = new PDFMerger();

  for (const doc of (
    await readdir("../data/Music", { withFileTypes: true })
  ).filter((doc) => doc.isFile() && /\.pdf/i.test(doc.name))) {
    const n = parseInt(
      doc.name.match(/^(?<num>[0-9]+)-/)?.groups?.num ?? "1",
      10
    ).toString(10);

    pdfMerger.add(notesPDF, [n]);

    pdfMerger.add(join("../data/Music", doc.name));
  }

  return await pdfMerger.saveAsBuffer();
}
