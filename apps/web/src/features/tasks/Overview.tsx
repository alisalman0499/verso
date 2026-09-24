import { Link } from 'react-router-dom'
import { pathForView } from './grouping'

// The page Verso opens on, at `/`. A placeholder until what it shows is
// decided (see TODO.md). The link to Today matters on phones: they have no
// sidebar yet, so without it there'd be no way from here to your tasks.
export default function Overview({ now }: { now: Date }) {
  return (
    <div className="flex-1 overflow-y-auto px-5 pt-8 lg:px-11">
      <div className="font-mono text-[10px] tracking-[0.16em] text-mute uppercase">
        Overview
      </div>
      <h2 className="mt-1.5 font-serif text-[clamp(34px,4.2vw,52px)] leading-none tracking-tight text-pure">
        {now.getDate()}{' '}
        <em className="text-bone">
          {now.toLocaleDateString('en-GB', { month: 'long' })}
        </em>
      </h2>

      <p className="mt-8 max-w-md text-sm text-mute">
        This page will bring your week together in one place. It&rsquo;s still
        being built.
      </p>
      <Link
        to={pathForView({ type: 'list', key: 'today' })}
        className="mt-4 inline-flex rounded-full border border-pure/16 px-4 py-2 text-sm text-bone hover:border-pure/36"
      >
        Go to Today
      </Link>
    </div>
  )
}
