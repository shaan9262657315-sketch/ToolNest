"use client";

import { useState } from "react";
import { Document, Packer, Paragraph, TextRun, AlignmentType } from "docx";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

type TextItem = {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
};

type PositionedItem = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type Line = {
  y: number;
  items: PositionedItem[];
};

export default function PDFToWordTool() {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const loadPDFJS = async () => {
    if (window.pdfjsLib) {
      return window.pdfjsLib;
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");

      script.src = "/pdfstudio/vendor/pdf.min.js";

      script.onload = () => resolve();

      script.onerror = () => {
        reject(new Error("Could not load PDF.js."));
      };

      document.head.appendChild(script);
    });

    if (!window.pdfjsLib) {
      throw new Error("PDF.js could not be loaded.");
    }

    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      "/pdfstudio/vendor/pdf.worker.min.js";

    return window.pdfjsLib;
  };

  const buildLines = (items: TextItem[]) => {
    const validItems: PositionedItem[] = items
      .filter((item) => item.str && item.str.trim())
      .map((item) => ({
        text: item.str!.trim(),
        x: item.transform?.[4] || 0,
        y: item.transform?.[5] || 0,
        width: item.width || 0,
        height: item.height || Math.abs(item.transform?.[3] || 10),
      }))
      .sort((a, b) => {
        if (Math.abs(a.y - b.y) <= 4) {
          return a.x - b.x;
        }

        return b.y - a.y;
      });

    const lines: Line[] = [];

    for (const item of validItems) {
      let line = lines.find(
        (existing) => Math.abs(existing.y - item.y) <= 4
      );

      if (!line) {
        line = {
          y: item.y,
          items: [],
        };

        lines.push(line);
      }

      line.items.push(item);
    }

    lines.sort((a, b) => b.y - a.y);

    return lines.map((line) => {
      line.items.sort((a, b) => a.x - b.x);

      let text = "";

      for (let i = 0; i < line.items.length; i++) {
        const current = line.items[i];
        const previous = line.items[i - 1];

        if (!previous) {
          text += current.text;
          continue;
        }

        const previousEnd = previous.x + previous.width;
        const gap = current.x - previousEnd;

        if (gap > 3) {
          text += " ";
        }

        text += current.text;
      }

      const averageHeight =
        line.items.reduce((sum, item) => sum + item.height, 0) /
        line.items.length;

      const firstX = line.items[0]?.x || 0;

      return {
        text: text.trim(),
        fontSize: averageHeight,
        x: firstX,
      };
    });
  };

  const isHeading = (text: string, fontSize: number, nextText?: string) => {
    if (!text) {
      return false;
    }

    const clean = text.trim();

    if (clean.length > 100) {
      return false;
    }

    if (
      /^(what is|requirement|example|time complexity|introduction|conclusion|summary|note|definition|features|advantages|disadvantages|algorithm|steps|applications)/i.test(
        clean
      )
    ) {
      return true;
    }

    if (fontSize >= 16) {
      return true;
    }

    if (
      clean.length < 70 &&
      !/[.!?]$/.test(clean) &&
      nextText &&
      nextText.length > clean.length
    ) {
      return true;
    }

    return false;
  };

  const convert = async () => {
    setError("");
    setDownloadUrl("");

    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setBusy(true);

    try {
      const pdfjsLib = await loadPDFJS();

      const buffer = await file.arrayBuffer();

      const pdf = await pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
      }).promise;

      const paragraphs: Paragraph[] = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();

        const lines = buildLines(content.items as TextItem[]);

        for (let i = 0; i < lines.length; i++) {
          const current = lines[i];

          if (!current.text) {
            continue;
          }

          const nextText = lines[i + 1]?.text;

          const heading = isHeading(
            current.text,
            current.fontSize,
            nextText
          );

          if (heading) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: current.text,
                    bold: true,
                    size: 28,
                  }),
                ],
                spacing: {
                  before: 220,
                  after: 120,
                },
                alignment: AlignmentType.LEFT,
              })
            );
          } else {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: current.text,
                    size: 22,
                  }),
                ],
                spacing: {
                  after: 100,
                  line: 276,
                },
              })
            );
          }
        }

        if (pageNumber < pdf.numPages) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "",
                }),
              ],
              pageBreakBefore: true,
            })
          );
        }
      }

      if (paragraphs.length === 0) {
        throw new Error(
          "No selectable text was found. This PDF may be scanned or image-based."
        );
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);

      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not convert the PDF to Word."
      );
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFile(null);
    setDownloadUrl("");
    setError("");
  };

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        PDF to Word Converter
      </h2>

      <p className="mt-2 text-gray-600">
        Convert PDF text into an editable Word document with improved
        headings, spacing, line structure, and page breaks.
      </p>

      <div className="mt-6 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            if (downloadUrl) {
              URL.revokeObjectURL(downloadUrl);
            }

            setFile(e.target.files?.[0] || null);
            setError("");
            setDownloadUrl("");
          }}
          className="mx-auto block w-full max-w-md"
        />

        {file && (
          <p className="mt-4 text-sm font-medium text-gray-700">
            Selected: {file.name}
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={convert}
          disabled={busy}
          className="rounded-xl bg-black px-5 py-3 font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Converting..." : "Convert to Word"}
        </button>

        <button
          onClick={reset}
          disabled={busy}
          className="rounded-xl border px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {downloadUrl && (
        <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-800">
            Conversion completed successfully.
          </p>

          <a
            href={downloadUrl}
            download="converted-document.docx"
            className="mt-3 inline-block rounded-xl bg-green-700 px-5 py-3 font-semibold text-white"
          >
            Download Word Document
          </a>
        </div>
      )}
    </div>
  );
}
