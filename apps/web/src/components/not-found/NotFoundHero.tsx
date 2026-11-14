import Link from 'next/link'
import { ArrowIcon, Button, MoleculeMark } from '@o3/ui'

/**
 * The 404's opening band — the 4-molecule-4, the line and the way home
 * (frames 3754:73927 and 3754:73809). The site's not-found and the landing
 * pages' both open with it.
 */
export function NotFoundHero() {
  return (
    <section className="bg-ink-warm px-gutter relative isolate flex min-h-[670px] flex-col items-center overflow-hidden pb-16 pt-40 text-center text-white lg:min-h-[959px] lg:pb-32 lg:pt-[254px]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[calc(50%-1.5px)] top-[-25px] -z-10 h-[1450px] w-[1621px] -translate-x-1/2 bg-[url(/images/not-found-stars.svg)]"
      />
      <div
        aria-hidden="true"
        className="flex h-[116px] items-center justify-center text-[164px] font-light leading-none lg:h-[270px] lg:text-[380px]"
      >
        <span>4</span>
        <MoleculeMark className="size-[116px] shrink-0 lg:size-[270px]" />
        <span>4</span>
      </div>
      <div className="mt-20 flex max-w-[656px] flex-col items-center gap-4 lg:mt-12">
        <h1 className="font-display text-interior-hero text-balance">This jawn doesn’t exist.</h1>
        <p className="text-lead max-w-[580px]">
          The page you’re looking for may have moved, disappeared, or never existed in the first
          place.
        </p>
      </div>
      <Button asChild variant="light" className="mt-16 lg:mt-12">
        <Link href="/">
          <ArrowIcon className="rotate-180" />
          Go home
        </Link>
      </Button>
    </section>
  )
}
