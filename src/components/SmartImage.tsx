"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { PLACEHOLDER_IMAGE } from "@/lib/site";

type SmartImageProps = Omit<ImageProps, "src"> & { src: string };

/**
 * next/image with the original site's fallback behaviour: if a photo fails to load
 * (e.g. a removed Unsplash image), the neutral placeholder is shown instead.
 */
export function SmartImage({ src, alt, onError, unoptimized, ...props }: SmartImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  const current = failed || !src ? PLACEHOLDER_IMAGE : src;
  const isRemote = /^https?:\/\//.test(current);

  return (
    <Image
      {...props}
      src={current}
      alt={alt}
      unoptimized={unoptimized ?? isRemote}
      data-error-image={failed || undefined}
      onError={(e) => {
        if (!failed) setFailedSrc(src);
        onError?.(e);
      }}
    />
  );
}
