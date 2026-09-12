"use client";

export default function PDFTextEditorTool() {
  return (
    <div className="w-full">
      <div className="mb-6 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">
          PDF Text Editor
        </h2>

        <p className="mt-2 text-gray-600">
          Edit existing PDF text, delete text, add new text,
          edit tables, organize pages, and save the edited PDF.
          Your PDF stays in your browser.
        </p>
      </div>

      <div
        className="w-full overflow-hidden rounded-2xl border bg-white shadow-sm"
        style={{ height: "calc(100vh - 180px)", minHeight: "800px" }}
      >
        <iframe
          src="/pdfstudio/index.html"
          title="PDF Text Editor"
          className="h-full w-full border-0"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
