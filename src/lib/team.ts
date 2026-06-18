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
    bio: `David is the Founder and CEO of Monroe Enterprise, a technology-focused holdings company, and a founding principal of Aura Venture Partners alongside Mustafa Samhoun, where he serves as CIO overseeing investments across crypto, defense, and AI infrastructure.

He also founded The Zero Knowledge Company, which develops financial applications powered by zero-knowledge proofs and is debuting a tokenized options platform. At Ionic, David guides direction on growth, fundraising, and venture procurement.

Before Ionic, David studied Computer Science at the University of Michigan before leaving to found Concord Systems, a profitable cryptocurrency trading & OTC desk that later evolved into an on-chain custody solutions developer.`,
    photo: '/team/david-monroe-rashid.jpg',
  },
  // { slug: 'ceo', name: 'XYZ', title: 'CEO', bio: '' },
  // { slug: 'coo', name: 'XYZ', title: 'COO', bio: '' },
  // { slug: 'cio', name: 'XYZ', title: 'CIO', bio: '' },
]
