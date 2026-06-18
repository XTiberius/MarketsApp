export type TeamMember = {
  slug: string
  name: string
  title: string
  /** Blank for now — fill in when ready. */
  bio: string
  /** Optional profile image served from /public (e.g. /team/<slug>.jpg). */
  photo?: string
}

// Public team roster. Add the remaining members below when ready — the Team page
// and the bust placeholder render every entry automatically. (CEO / COO / CIO are
// intentionally omitted for now; uncomment + fill in to add them.)
export const TEAM: TeamMember[] = [
  {
    slug: 'david-monroe-rashid',
    name: 'David Monroe Rashid',
    title: 'Founder & Chairman',
    bio: '',
    photo: '/team/david-monroe-rashid.jpg',
  },
  // { slug: 'ceo', name: 'XYZ', title: 'CEO', bio: '' },
  // { slug: 'coo', name: 'XYZ', title: 'COO', bio: '' },
  // { slug: 'cio', name: 'XYZ', title: 'CIO', bio: '' },
]
