import Link from 'next/link'
import { ArrowIcon, Button, MoleculeMark } from '@o3/ui'
import { NotFoundCta } from './NotFoundCta'

/** Current 404 frames 3754:73927 and 3754:73809. */
export default function NotFound() {
  return (
    <>
      <section className="bg-ink-warm px-gutter flex min-h-[670px] flex-col items-center pb-16 pt-40 text-center text-white lg:min-h-[959px] lg:pb-32 lg:pt-[254px]">
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
      <NotFoundCta
        heading="You may be feeling lost right now, but don’t panic."
        body="We love a new challenge. If you’re ready to tackle what’s next, we’re ready to help."
        decoration="orbs"
        button={{
          _type: 'button',
          label: 'Let’s talk',
          href: '/contact',
          contrast: 'light',
          target: null,
        }}
      />
    </>
  )
}
