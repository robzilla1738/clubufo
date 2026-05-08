import Link from "next/link";
import { AlienIcon } from "@/components/site/alien-icon";

export const metadata = { title: "[404] // PAGE MISSING" };

export default function NotFound() {
  return (
    <div className="ufo-page-pad flex-1 flex items-center justify-center py-20 md:py-24">
      <div className="max-w-lg text-center space-y-6">
        <AlienIcon size={48} className="mx-auto text-cyan opacity-60" />
        <p className="ufo-kicker ufo-kicker-strong">
          &gt; PAGE MISSING
        </p>
        <h1 className="ufo-headline">
          404: PAGE NOT IN
          <br />
          THE ARCHIVE
        </h1>
        <p className="ufo-copy mx-auto max-w-md uppercase tracking-[0.08em]">
          THAT PAGE IS NOT IN THE ARCHIVE.
        </p>
        <div className="flex flex-col justify-center gap-3 pt-4 sm:flex-row">
          <Link
            href="/"
            className="ufo-action ufo-action-primary px-5 tracking-[0.22em]"
          >
            &gt; RETURN HOME
          </Link>
          <Link
            href="/chat"
            className="ufo-action px-5 tracking-[0.22em]"
          >
            OPEN CHAT
          </Link>
        </div>
      </div>
    </div>
  );
}
