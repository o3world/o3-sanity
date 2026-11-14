import { NotFoundHero } from '@/components/not-found/NotFoundHero'
import { NotFoundCta } from './NotFoundCta'

/** Current 404 frames 3754:73927 and 3754:73809. */
export default function NotFound() {
  return (
    <>
      <NotFoundHero />
      <NotFoundCta
        heading={'You may be feeling lost\nright now, but don’t panic.'}
        mobileHeading={'You may be feeling\nlost right now,\nbut don’t panic.'}
        body={
          'Helping folks find their way through complex digital\nchallenges is our day job. Consider this the warm-up.'
        }
        button={{
          _type: 'button',
          label: 'Talk to our team',
          href: '/contact',
          contrast: 'light',
          target: null,
        }}
      />
    </>
  )
}
