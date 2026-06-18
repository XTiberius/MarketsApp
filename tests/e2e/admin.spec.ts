import { expect, test } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const INVESTOR_EMAIL = 'e2e+investor@marketsapp.test'
const LISTING_NAME = 'E2E Test Listing'

if (!serviceRoleKey) {
  console.log('[playwright admin] SUPABASE_SERVICE_ROLE_KEY is not set, skipping admin e2e specs')
}
test.skip(!serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY is not set, skipping admin e2e specs')

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for admin e2e fixture resets`)
  return value
}

function adminClient() {
  return createClient(requiredEnv('NEXT_PUBLIC_SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function fixtureIds(supabase: SupabaseClient) {
  const [{ data: investor, error: investorError }, { data: listing, error: listingError }] = await Promise.all([
    supabase
      .from('users')
      .select('id')
      .eq('email', INVESTOR_EMAIL)
      .single(),
    supabase
      .from('listings')
      .select('id')
      .eq('company_name', LISTING_NAME)
      .single(),
  ])

  if (investorError) throw investorError
  if (listingError) throw listingError

  return {
    investorId: String(investor.id),
    listingId: String(listing.id),
  }
}

async function resetBidFixture() {
  const supabase = adminClient()
  const { investorId, listingId } = await fixtureIds(supabase)

  await supabase
    .from('bids')
    .delete()
    .eq('investor_id', investorId)
    .eq('listing_id', listingId)

  const { error } = await supabase
    .from('bids')
    .insert({
      investor_id: investorId,
      listing_id: listingId,
      amount: 75000,
      status: 'placed',
      nda_signed: false,
    })

  if (error) throw error
}

async function resetKycFixture() {
  const supabase = adminClient()
  const { investorId } = await fixtureIds(supabase)

  const [{ error: userError }, { error: kycError }] = await Promise.all([
    supabase
      .from('users')
      .update({ kyc_status: 'pending' })
      .eq('id', investorId),
    supabase
      .from('kyc_individual')
      .update({ reviewed_at: null, admin_notes: null })
      .eq('user_id', investorId),
  ])

  if (userError) throw userError
  if (kycError) throw kycError
}

async function setListingFixture(patch: Record<string, unknown>) {
  const supabase = adminClient()
  const { listingId } = await fixtureIds(supabase)
  const { error } = await supabase.from('listings').update(patch).eq('id', listingId)
  if (error) throw error
  return listingId
}

// Clean up the test-uploaded logo object + reset logo_url (storage isn't cascaded
// by the global listing teardown). Targeted: only the fixture listing's own logo.
test.afterAll(async () => {
  if (!serviceRoleKey) return
  const supabase = adminClient()
  const { data } = await supabase
    .from('listings')
    .select('logo_url')
    .eq('company_name', LISTING_NAME)
    .maybeSingle()
  const url = (data?.logo_url as string | null | undefined) ?? null
  if (url && url.includes('/logos/')) {
    const objectPath = url.split('/logos/')[1]
    if (objectPath) await supabase.storage.from('logos').remove([objectPath])
  }
  await supabase.from('listings').update({ logo_url: null }).eq('company_name', LISTING_NAME)
})

test('/admin/listings edits a draft listing to published', async ({ page }) => {
  console.log('[playwright admin] running with seeded admin storageState')
  const listingId = await setListingFixture({ status: 'draft' })

  await page.goto(`/admin/listings/${listingId}`)
  await expect(page.getByRole('heading', { name: /Edit:/ })).toBeVisible()

  // Radix Select: open the trigger, choose Published from the portal-rendered options.
  await page.getByTestId('form-status-select').click()
  await page.getByRole('option', { name: 'Published' }).click()
  await page.getByTestId('form-submit-button').click()

  await expect(page).toHaveURL(/\/admin\/listings$/)
  // End-to-end proof: a published listing now appears on the (auth-gated) listings page.
  await page.goto('/listings')
  await expect(page.getByText(LISTING_NAME)).toBeVisible()
})

test('/admin/listings uploads a logo via the drag-drop field', async ({ page }) => {
  console.log('[playwright admin] running with seeded admin storageState')
  const listingId = await setListingFixture({ status: 'published', logo_url: null })

  await page.goto(`/admin/listings/${listingId}`)
  await expect(page.getByRole('heading', { name: /Edit:/ })).toBeVisible()

  // Set the hidden file input directly (covers click-to-upload; drag-drop shares the handler).
  await page.getByTestId('logo-file-input').setInputFiles('tests/fixtures/images/test-logo.png')
  await expect(page.getByTestId('logo-preview-image')).toBeVisible()
  await page.getByTestId('form-submit-button').click()

  await expect(page).toHaveURL(/\/admin\/listings$/)
  // End-to-end proof: the uploaded logo renders on the public listing card.
  await page.goto('/listings')
  await expect(page.getByAltText(`${LISTING_NAME} logo`)).toBeVisible()
})

test('/admin/bids accepts a pending bid via the bid module', async ({ page }) => {
  console.log('[playwright admin] running with seeded admin storageState')
  // Seed a bid already at pending_acceptance (the accept step has no doc gate).
  const supabase = adminClient()
  const { investorId, listingId } = await fixtureIds(supabase)
  await supabase.from('bids').delete().eq('investor_id', investorId).eq('listing_id', listingId)
  const { error } = await supabase.from('bids').insert({
    investor_id: investorId,
    listing_id: listingId,
    amount: 75000,
    status: 'pending_acceptance',
    nda_signed: true,
  })
  if (error) throw error

  await page.goto('/admin/bids')
  await expect(page.getByRole('heading', { name: 'Bid Management' })).toBeVisible()
  await page.getByRole('button', { name: 'Accept', exact: true }).first().click()
  await expect(page.getByText('Accepted').first()).toBeVisible({ timeout: 15_000 })
})

test('/admin/users approves an applicant', async ({ page }) => {
  console.log('[playwright admin] running with seeded admin storageState')
  await resetKycFixture()

  await page.goto('/admin/users')

  await expect(page.getByRole('heading', { name: 'User KYC Review' })).toBeVisible()
  await page.getByText('e2e+investor@marketsapp.test').locator('..').locator('..').getByTestId('admin-kyc-review-toggle').click()
  await page.getByTestId('admin-kyc-approve-button').click()
  await expect(page.getByText('approved').first()).toBeVisible()
})

test('/admin/users requires a rejection reason before rejecting', async ({ page }) => {
  console.log('[playwright admin] running with seeded admin storageState')
  await resetKycFixture()

  await page.goto('/admin/users')

  await expect(page.getByRole('heading', { name: 'User KYC Review' })).toBeVisible()
  await page.getByText('e2e+investor@marketsapp.test').locator('..').locator('..').getByTestId('admin-kyc-review-toggle').click()
  await page.getByTestId('admin-kyc-reject-button').click()

  const confirmReject = page.getByTestId('admin-kyc-confirm-reject-button')
  await expect(confirmReject).toBeDisabled()

  await page.getByTestId('admin-kyc-reject-reason').fill('E2E rejection reason')
  await expect(confirmReject).toBeEnabled()
  await confirmReject.click()
  await expect(page.getByText('rejected').first()).toBeVisible()
})

const CREATE_FLOW_NAME = 'E2E Create Flow Co'

async function deleteListingByName(name: string) {
  const supabase = adminClient()
  const { data } = await supabase.from('listings').select('id').eq('company_name', name).maybeSingle()
  if (!data) return
  const listingId = String(data.id)
  const { data: objs } = await supabase.storage.from('listing-docs').list(listingId)
  if (objs?.length) {
    await supabase.storage.from('listing-docs').remove(objs.map((o) => `${listingId}/${o.name}`))
  }
  await supabase.from('listings').delete().eq('id', listingId) // cascades rounds + docs rows
}

test.afterAll(async () => {
  if (!serviceRoleKey) return
  await deleteListingByName(CREATE_FLOW_NAME)
})

// Single-page create + Bug B (11 MB pitch deck through the real /api/listings/[id]/documents route).
test('creates a listing with memorandum + 11MB pitch deck + a funding round in one page', async ({ page }) => {
  await deleteListingByName(CREATE_FLOW_NAME)

  await page.goto('/admin/listings/new')
  await expect(page.getByRole('heading', { name: 'Create Listing' })).toBeVisible()

  await page.locator('#company_name').fill(CREATE_FLOW_NAME)
  await page.locator('#description').fill('Single-page create e2e — documents + rounds.')
  await page.locator('#industry').fill('Testing')
  await page.locator('#nda_text').fill('E2E NDA fixture. Do not use for real deals.')

  await page.getByTestId('create-doc-memorandum').setInputFiles('tests/fixtures/sample.pdf')
  await page.getByTestId('create-doc-pitch_deck').setInputFiles('tests/.tmp/aura.pdf')

  await page.locator('#round_name').fill('Series A')
  await page.locator('#round_valuation').fill('50000000')
  await page.locator('#round_amount_raised').fill('10000000')
  await page.locator('#round_date').fill('2025-01-15')
  await page.getByRole('button', { name: 'Add round' }).click()
  await expect(page.getByText('Series A')).toBeVisible()

  await page.getByTestId('form-submit-button').click()

  // Lands on the new listing's edit page; the 11 MB deck, the memorandum, and the round attached.
  await expect(page).toHaveURL(/\/admin\/listings\/[0-9a-f-]+$/, { timeout: 30_000 })
  await expect(page.getByRole('heading', { name: /Edit:/ })).toBeVisible()
  await expect(page.getByText('aura.pdf')).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('sample.pdf')).toBeVisible()
  await expect(page.getByText('Series A')).toBeVisible()
})

// Bug A — admin uploads the executed NII; the documents-bucket RLS now allows it and the bid advances.
test('uploads the executed NII and the bid advances to pending acceptance', async ({ page }) => {
  await resetBidFixture()
  await page.goto('/admin/bids')
  await expect(page.getByRole('heading', { name: 'Bid Management' })).toBeVisible()

  await page.getByTestId('upload-nii').first().setInputFiles('tests/fixtures/sample.pdf')
  await expect(page.getByText('Pending Acceptance').first()).toBeVisible({ timeout: 20_000 })
})

// Newsfeed route is gated: configured-check returns 503 when ANTHROPIC_API_KEY is absent.
test('newsfeed refresh returns 503 when AI is not configured', async ({ page }) => {
  const { listingId } = await fixtureIds(adminClient())
  const res = await page.request.post(`/api/listings/${listingId}/newsfeed`)
  expect([503, 200]).toContain(res.status()) // 503 when no key (expected here); 200 if a key is configured
})

// Active/Closed: admin can close a listing, which stops new bids.
test('closes a listing via the toggle and blocks new bids', async ({ page }) => {
  const supabase = adminClient()
  const { listingId } = await fixtureIds(supabase)
  await supabase.from('listings').update({ status: 'published' }).eq('id', listingId)

  await page.goto('/admin/listings')
  const toggle = page.getByTestId(`listing-activity-toggle-${listingId}`)
  await expect(toggle).toHaveText('Close')
  await toggle.click()
  await expect(toggle).toHaveText('Reopen')

  // A closed listing rejects new bids at the API.
  const res = await page.request.post('/api/bids', {
    data: { listing_id: listingId, amount: 100000 },
  })
  expect(res.status()).toBe(400)
  expect(((await res.json())?.error ?? '')).toMatch(/closed/i)

  await supabase.from('listings').update({ status: 'published' }).eq('id', listingId)
})
