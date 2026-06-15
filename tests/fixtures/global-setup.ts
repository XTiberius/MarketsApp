import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js'
import type { FullConfig } from '@playwright/test'

const INVESTOR_EMAIL = 'e2e+investor@marketsapp.test'
const ADMIN_EMAIL = 'e2e+admin@marketsapp.test'
const LISTING_NAME = 'E2E Test Listing'
const TEST_PASSWORD = 'E2E-test-password-please-ignore-12345'
const authDir = path.join(process.cwd(), 'tests/.auth')

type FixtureUser = {
  id: string
  email: string
}

type ListingFixture = {
  id: string
}

type StorageState = {
  cookies: Array<{
    name: string
    value: string
    domain: string
    path: string
    expires: number
    httpOnly: boolean
    secure: boolean
    sameSite: 'Lax' | 'Strict' | 'None'
  }>
  origins: Array<{
    origin: string
    localStorage: Array<{
      name: string
      value: string
    }>
  }>
}

type Role = 'investor' | 'admin'

type PublicUserPatch = {
  role: Role
  kyc_status: 'approved' | 'pending'
  first_name: string
  last_name: string
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for Playwright auth seeding`)
  return value
}

function storageKey(supabaseUrl: string) {
  const url = new URL(supabaseUrl)
  return `sb-${url.hostname.split('.')[0]}-auth-token`
}

function base64Url(value: string) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function chunkCookie(name: string, value: string) {
  const maxChunkSize = 3180
  const encodedValue = encodeURIComponent(value)

  if (encodedValue.length <= maxChunkSize) {
    return [{ name, value }]
  }

  const chunks: { name: string, value: string }[] = []
  let rest = encodedValue

  while (rest.length > 0) {
    let encodedChunk = rest.slice(0, maxChunkSize)
    const lastEscapePosition = encodedChunk.lastIndexOf('%')

    if (lastEscapePosition > maxChunkSize - 3) {
      encodedChunk = encodedChunk.slice(0, lastEscapePosition)
    }

    let valueHead = ''
    while (encodedChunk.length > 0) {
      try {
        valueHead = decodeURIComponent(encodedChunk)
        break
      } catch (error) {
        if (
          error instanceof URIError &&
          encodedChunk.at(-3) === '%' &&
          encodedChunk.length > 3
        ) {
          encodedChunk = encodedChunk.slice(0, encodedChunk.length - 3)
        } else {
          throw error
        }
      }
    }

    chunks.push({ name: `${name}.${chunks.length}`, value: valueHead })
    rest = rest.slice(encodedChunk.length)
  }

  return chunks
}

function storageStateFromSession(supabaseUrl: string, session: Session): StorageState {
  const encodedSession = `base64-${base64Url(JSON.stringify(session))}`
  const url = new URL(supabaseUrl)
  const cookies = chunkCookie(storageKey(supabaseUrl), encodedSession).map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    domain: 'localhost',
    path: '/',
    expires: Math.floor(Date.now() / 1000) + 400 * 24 * 60 * 60,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax' as const,
  }))

  return {
    cookies,
    origins: [
      {
        origin: 'http://localhost:3000',
        localStorage: [
          {
            name: storageKey(supabaseUrl),
            value: JSON.stringify(session),
          },
          {
            name: `${storageKey(supabaseUrl)}-code-verifier`,
            value: '',
          },
        ],
      },
      {
        origin: `${url.protocol}//${url.host}`,
        localStorage: [
          {
            name: storageKey(supabaseUrl),
            value: JSON.stringify(session),
          },
        ],
      },
    ],
  }
}

async function findAuthUserByEmail(supabase: SupabaseClient, email: string) {
  const perPage = 100

  let page = 1
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email === email)
    if (user) return user

    if (data.users.length < perPage) return null
    page += 1
  }

  return null
}

async function upsertAuthUser(supabase: SupabaseClient, email: string): Promise<FixtureUser> {
  const existing = await findAuthUserByEmail(supabase, email)
  if (existing?.id) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      email_confirm: true,
      password: TEST_PASSWORD,
    })
    if (error) throw error
    return { id: data.user.id, email }
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) throw error
  if (!data.user.email) throw new Error(`Seeded auth user missing email for ${email}`)

  return { id: data.user.id, email }
}

async function upsertPublicUser(
  supabase: SupabaseClient,
  user: FixtureUser,
  patch: PublicUserPatch
) {
  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      ...patch,
    }, { onConflict: 'id' })

  if (error) throw error
}

async function upsertKycIndividual(supabase: SupabaseClient, user: FixtureUser) {
  const { error } = await supabase
    .from('kyc_individual')
    .upsert({
      user_id: user.id,
      first_name: 'E2E',
      last_name: 'Applicant',
      dob: '1990-01-01',
      address: '123 Test Market Street',
      phone: '555-0100',
      occupation: 'Investor',
      accredited_investor: true,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      admin_notes: null,
    }, { onConflict: 'user_id' })

  if (error) throw error
}

async function upsertListing(supabase: SupabaseClient, admin: FixtureUser): Promise<ListingFixture> {
  const { data: existing, error: findError } = await supabase
    .from('listings')
    .select('id')
    .eq('company_name', LISTING_NAME)
    .maybeSingle()

  if (findError) throw findError

  const listing = {
    admin_id: admin.id,
    company_name: LISTING_NAME,
    logo_url: null,
    description: 'A clearly marked Playwright fixture listing for e2e coverage.',
    valuation: 12500000,
    amount_raised: 1500000,
    investment_structure: 'SAFE with pro rata rights',
    nda_text: 'E2E NDA fixture. Do not use for real deals.',
    listing_type: 'primary',
    industry: 'Testing',
    status: 'published',
  }

  if (existing) {
    const { data, error } = await supabase
      .from('listings')
      .update(listing)
      .eq('id', existing.id)
      .select('id')
      .single()

    if (error) throw error
    return data as ListingFixture
  }

  const { data, error } = await supabase
    .from('listings')
    .insert(listing)
    .select('id')
    .single()

  if (error) throw error
  return data as ListingFixture
}

async function seedBid(supabase: SupabaseClient, investor: FixtureUser, listing: ListingFixture) {
  await supabase
    .from('bids')
    .delete()
    .eq('investor_id', investor.id)
    .eq('listing_id', listing.id)

  const { error } = await supabase
    .from('bids')
    .insert({
      investor_id: investor.id,
      listing_id: listing.id,
      amount: 75000,
      status: 'placed',
      nda_signed: false,
    })

  if (error) throw error
}

async function clearInvestorSignature(supabase: SupabaseClient, investor: FixtureUser, listing: ListingFixture) {
  const { error } = await supabase
    .from('nda_signatures')
    .delete()
    .eq('investor_id', investor.id)
    .eq('listing_id', listing.id)

  if (error) throw error
}

async function signIn(supabaseUrl: string, anonKey: string, email: string) {
  const supabase = createClient(supabaseUrl, anonKey)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })

  if (error) throw error
  if (!data.session) throw new Error(`Could not create session for ${email}`)

  return data.session
}

export default async function globalSetup(config: FullConfig) {
  void config

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[playwright globalSetup] SUPABASE_SERVICE_ROLE_KEY is not set, skipping auth seeding')
    return
  }

  const supabaseUrl = requiredEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = requiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  await mkdir(authDir, { recursive: true })

  const investor = await upsertAuthUser(supabase, INVESTOR_EMAIL)
  const admin = await upsertAuthUser(supabase, ADMIN_EMAIL)

  await upsertPublicUser(supabase, investor, {
    role: 'investor',
    kyc_status: 'approved',
    first_name: 'E2E',
    last_name: 'Investor',
  })
  await upsertPublicUser(supabase, admin, {
    role: 'admin',
    kyc_status: 'approved',
    first_name: 'E2E',
    last_name: 'Admin',
  })
  await upsertKycIndividual(supabase, investor)

  const listing = await upsertListing(supabase, admin)
  await clearInvestorSignature(supabase, investor, listing)
  await seedBid(supabase, investor, listing)

  const investorSession = await signIn(supabaseUrl, anonKey, INVESTOR_EMAIL)
  const adminSession = await signIn(supabaseUrl, anonKey, ADMIN_EMAIL)

  await writeFile(
    path.join(authDir, 'investor.json'),
    JSON.stringify(storageStateFromSession(supabaseUrl, investorSession), null, 2)
  )
  await writeFile(
    path.join(authDir, 'admin.json'),
    JSON.stringify(storageStateFromSession(supabaseUrl, adminSession), null, 2)
  )
}
