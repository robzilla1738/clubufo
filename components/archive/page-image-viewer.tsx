"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PageImageViewer({
  page,
  thumbUrl,
  imageUrl,
}: {
  page: number;
  thumbUrl: string | null;
  imageUrl: string | null;
}) {
  const previewSrc = thumbUrl ?? imageUrl;
  const fullSrc = imageUrl ?? thumbUrl;

  if (!previewSrc || !fullSrc) return null;

  return (
    <Dialog>
      <DialogTrigger
        className="group relative block w-full overflow-hidden border hairline bg-background/40 text-left transition-[border-color,background-color,scale] hover:border-cyan hover:bg-cyan/[0.035] active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
        aria-label={`Open page ${page} image full size`}
      >
        <div className="relative aspect-[3/4] overflow-hidden">
          <Image
            src={previewSrc}
            alt={`Page ${page}`}
            fill
            unoptimized
            sizes="160px"
            className="object-cover object-top image-outline transition-opacity group-hover:opacity-90"
          />
        </div>
        <span className="absolute inset-x-2 bottom-2 flex items-center justify-between bg-background/88 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <span>VIEW FULL PAGE</span>
          <Maximize2 aria-hidden="true" className="size-3" strokeWidth={1.5} />
        </span>
      </DialogTrigger>

      <DialogContent
        className="max-h-[94dvh] max-w-[min(96vw,1120px)] gap-0 overflow-hidden border hairline bg-background/95 p-0 ring-cyan/20 sm:max-w-[min(96vw,1120px)]"
        showCloseButton
      >
        <div className="flex min-h-14 items-center justify-between gap-4 border-b hairline px-4 py-3 pr-12">
          <div className="min-w-0">
            <DialogTitle className="ufo-kicker ufo-kicker-strong">
              PAGE {page}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Full page image
            </DialogDescription>
          </div>
          <a
            href={fullSrc}
            target="_blank"
            rel="noreferrer"
            className="ufo-action hidden sm:inline-flex"
          >
            OPEN IMAGE
          </a>
        </div>
        <div className="max-h-[calc(94dvh-3.5rem)] overflow-auto bg-white p-2 sm:p-4">
          <Image
            src={fullSrc}
            alt={`Full page ${page}`}
            width={1400}
            height={1867}
            unoptimized
            sizes="(min-width: 1024px) 1040px, 94vw"
            className="mx-auto h-auto w-full max-w-[1040px] bg-white object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
