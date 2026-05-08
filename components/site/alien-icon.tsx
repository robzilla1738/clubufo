import { cn } from "@/lib/utils";

/**
 * Mono-stroke alien head. Designed to read as a small "logo" glyph at 16-24px
 * in the HUD bar — kept geometric so it lines up with the typography baseline.
 */
export function AlienIcon({
  className,
  size = 18,
  ...rest
}: { size?: number } & React.SVGAttributes<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("shrink-0", className)}
      {...rest}
    >
      {/* Head silhouette — wider crown, tapered chin */}
      <path d="M12 2.6 C 7 2.6 4.2 6 4.2 9.8 C 4.2 13.6 6.4 17 8.8 19.2 C 9.8 20.1 10.8 21.4 12 21.4 C 13.2 21.4 14.2 20.1 15.2 19.2 C 17.6 17 19.8 13.6 19.8 9.8 C 19.8 6 17 2.6 12 2.6 Z" />
      {/* Left eye — almond, tilted inward */}
      <path
        d="M7.4 9.5 C 7.4 11.5 8.4 13 9.6 13 C 10.6 13 11.2 12 10.7 10.6 C 10.2 9.2 9 8.4 8.2 8.6 C 7.7 8.7 7.4 9 7.4 9.5 Z"
        fill="currentColor"
      />
      {/* Right eye — mirrored */}
      <path
        d="M16.6 9.5 C 16.6 11.5 15.6 13 14.4 13 C 13.4 13 12.8 12 13.3 10.6 C 13.8 9.2 15 8.4 15.8 8.6 C 16.3 8.7 16.6 9 16.6 9.5 Z"
        fill="currentColor"
      />
      {/* Tiny mouth */}
      <path d="M11 17 L 13 17" />
    </svg>
  );
}
