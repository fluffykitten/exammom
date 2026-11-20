"use client";

import { pdf } from "@react-pdf/renderer";
import { MomPdfDocument } from "./MomPdfDocument";
import type { FormSnapshot } from "@/types/mom";

function resolveAssetUrl(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${url}`;
  }
  return url;
}

export async function generateMomPdfBlob(snapshot: FormSnapshot): Promise<Blob> {
  const resolvedSnapshot: FormSnapshot = {
    ...snapshot,
    header: {
      ...snapshot.header,
      left_logo_url: resolveAssetUrl(snapshot.header.left_logo_url),
      right_logo_url: resolveAssetUrl(snapshot.header.right_logo_url),
    },
  };
  const instance = pdf(<MomPdfDocument snapshot={resolvedSnapshot} />);
  return await instance.toBlob();
}
