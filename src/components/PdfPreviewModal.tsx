"use client";

import { useEffect, useState } from "react";
import { Download, X, ExternalLink, Copy, Check } from "lucide-react";

interface PdfPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  pdfUrl?: string | null;
  pdfBlob?: Blob | null;
  downloadFilename?: string;
}

export function PdfPreviewModal({
  open,
  onClose,
  title,
  pdfUrl,
  pdfBlob,
  downloadFilename = "minutes-of-meeting.pdf",
}: PdfPreviewModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || !pdfBlob) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(pdfBlob);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, pdfBlob]);

  if (!open) return null;

  const activeSrc = objectUrl || pdfUrl || "";

  const handleCopy = async () => {
    if (!pdfUrl) return;
    await navigator.clipboard.writeText(pdfUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
            <p className="text-xs text-slate-500">A4 Minutes of Meeting PDF Preview</p>
          </div>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Copied Link
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Share Link
                  </>
                )}
              </button>
            )}
            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Tab
              </a>
            )}
            {activeSrc && (
              <a
                href={activeSrc}
                download={downloadFilename}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#162d4a]"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100">
          {activeSrc ? (
            <iframe
              src={activeSrc}
              title={title}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">
              Generating PDF preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
