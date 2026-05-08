import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? 28 : size === "sm" ? 18 : 22;
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex items-center gap-2.5 select-none",
        className,
      )}
      aria-label="ClubUFO home"
    >
      <span
        className="relative inline-flex items-center justify-center"
        style={{ width: dim, height: dim }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          width={dim}
          height={dim}
          aria-hidden
          className="text-foreground transition-colors group-hover:text-primary"
        >
          {/* Saucer dome */}
          <path
            d="M7 11c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* Disc */}
          <ellipse
            cx="12"
            cy="13"
            rx="9"
            ry="2.4"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          {/* Beam */}
          <path
            d="M9.5 15.5L8 21M14.5 15.5L16 21M12 15.6V21"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeOpacity="0.5"
          />
        </svg>
        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity blur-md bg-primary/30" />
      </span>
      <span
        className={cn(
          "font-display tracking-tight text-foreground",
          size === "lg" && "text-2xl",
          size === "md" && "text-lg",
          size === "sm" && "text-base",
        )}
      >
        ClubUFO
      </span>
    </Link>
  );
}
