import type { Metadata } from 'next'
import { TEAM } from '@/lib/team'
import { TeamBust } from '@/components/team/TeamBust'

// Public page — no auth gate, so any visitor can reach /team.
export const metadata: Metadata = {
  title: 'Team — IONIC',
  description: 'The people behind IONIC.',
}

export default function TeamPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">The team</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          The people behind IONIC
        </h1>
      </header>

      <div className="mt-12 grid gap-x-8 gap-y-12 sm:grid-cols-2">
        {TEAM.map((member) => (
          <article key={member.slug} className="space-y-5">
            <TeamBust member={member} />
            <div>
              <h2 className="font-display text-2xl font-medium">{member.name}</h2>
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-primary">
                {member.title}
              </p>
              {member.bio && (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{member.bio}</p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
