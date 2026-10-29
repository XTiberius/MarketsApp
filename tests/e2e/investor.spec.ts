import { expect, test } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const INVESTOR_EMAIL = 'e2e+investor@marketsapp.test'
const LISTING_NAME = 'E2E Test Listing'

if (!serviceRoleKey) {
  console.log('[playwright investor] SUPABASE_SERVICE_ROLE_KEY is not set, skipping investor e2e specs')
}
test.skip(!serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY is not set, skipping investor e2e specs')

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required for investor e2e fixture resets`)
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

async function resetInvestorFixture({
  signature,
  bid,
}: {
  signature: 'present' | 'absent'
  bid: 'present' | 'absent'
}) {
  const supabase = adminClient()
  const { investorId, listingId } = await fixtureIds(supabase)

  await supabase
    .from('bids')
    .delete()
    .eq('investor_id', investorId)
    .eq('listing_id', listingId)

  await supabase
    .from('nda_signatures')
    .delete()
    .eq('investor_id', investorId)
    .eq('listing_id', listingId)

  if (signature === 'present') {
    const { error } = await supabase
      .from('nda_signatures')
      .insert({
        investor_id: investorId,
        listing_id: listingId,
        signature_image_url: 'https://example.test/e2e-signature.png',
      })

    if (error) throw error
  }

  if (bid === 'present') {
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
}

test('signs NDA and unlocks deal details', async ({ page }) => {
  console.log('[playwright investor] running with seeded investor storageState')
  await resetInvestorFixture({ signature: 'absent', bid: 'absent' })

  await page.goto('/listings')
  await page.getByRole('link', { name: /E2E Test Listing/ }).click()

  await page.getByTestId('nda-open-button').click()
  await expect(page.getByTestId('nda-modal')).toBeVisible()

  const canvas = page.getByTestId('signature-canvas')
  const box = await canvas.boundingBox()
  expect(box).not.toBeNull()

  if (!box) throw new Error('Signature canvas was not measurable')

  await page.mouse.move(box.x + 24, box.y + 60)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 95)
  await page.mouse.move(box.x + 220, box.y + 45)
  await page.mouse.up()

  await page.getByLabel(/I agree to the terms of this NDA/).check()
  await page.getByTestId('nda-submit-button').click()

  await expect(page.getByText(/NDA signed/)).toBeVisible()
  await page.waitForURL(/\/listings\//)
  await expect(page.getByRole('heading', { name: 'Deal Details' })).toBeVisible()
})

test('places bids with minimum validation and success state', async ({ page }) => {
  console.log('[playwright investor] running with seeded investor storageState')
  await resetInvestorFixture({ signature: 'present', bid: 'absent' })

  await page.goto('/listings')
  await page.getByRole('link', { name: /E2E Test Listing/ }).click()

  if (await page.getByTestId('nda-open-button').isVisible()) {
    await page.getByTestId('nda-open-button').click()
    const canvas = page.getByTestId('signature-canvas')
    const box = await canvas.boundingBox()
    expect(box).not.toBeNull()
    if (!box) throw new Error('Signature canvas was not measurable')
    await page.mouse.move(box.x + 24, box.y + 60)
    await page.mouse.down()
    await page.mouse.move(box.x + 180, box.y + 80)
    await page.mouse.up()
    await page.getByLabel(/I agree to the terms of this NDA/).check()
    await page.getByTestId('nda-submit-button').click()
    await expect(page.getByText(/NDA signed/)).toBeVisible()
    await page.waitForURL(/\/listings\//)
  }

  await page.getByTestId('bid-open-button').click()
  await expect(page.getByTestId('bid-modal')).toBeVisible()

  await page.getByLabel('Bid Amount (USD)').fill('49000')
  await page.getByTestId('bid-submit-button').click()
  await expect(page.getByText(/Minimum bid is/)).toBeVisible()

  await page.getByLabel('Bid Amount (USD)').fill('60000')
  await page.getByTestId('bid-submit-button').click()
  await expect(page.getByText('Bid placed!')).toBeVisible()
})

// Put the fixture's individual KYC row back. The two end-user specs below strip the
// account's bidding parties, and every other spec here expects the seeded investor.
async function restoreIndividualKyc(supabase: SupabaseClient, investorId: string) {
  const { error } = await supabase
    .from('kyc_individual')
    .upsert({
      user_id: investorId,
      first_name: 'E2E',
      last_name: 'Applicant',
      dob: '1990-01-01',
      address: '123 Test Market Street',
      phone: '555-0100',
      occupation: 'Investor',
      accredited_investor: true,
      submitted_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) throw error
}

// An admin can approve an account through /api/users without a kyc_individual row
// ever being written. The holder is still an approved individual, so they must be
// offered as a bidding party — gating that option on the row's existence left this
// account with an empty selector and no way to bid.
test('an approved individual with no KYC row can bid as themselves', async ({ page }) => {
  const supabase = adminClient()
  const { investorId, listingId } = await fixtureIds(supabase)
  await resetInvestorFixture({ signature: 'present', bid: 'absent' })

  await supabase.from('kyc_individual').delete().eq('user_id', investorId)
  await supabase.from('kyc_entity').delete().eq('user_id', investorId)

  try {
    await page.goto(`/listings/${listingId}`)
    await page.getByTestId('bid-open-button').click()
    await expect(page.getByTestId('bid-modal')).toBeVisible()

    // The selector renders and is preselected on the sole party.
    await expect(page.getByTestId('bid-end-user')).toBeVisible()
    await expect(page.getByTestId('bid-end-user')).toContainText('Individual')

    await page.getByLabel('Bid Amount (USD)').fill('60000')
    await page.getByTestId('bid-submit-button').click()
    await expect(page.getByText('Bid placed!')).toBeVisible()
  } finally {
    await restoreIndividualKyc(supabase, investorId)
  }
})

// With no bidding party at all, submitting used to fail validation on a selector the
// modal never rendered. The modal must explain what is missing instead. Unapproved
// accounts never reach the modal now (requireKycApproved), so the reachable case is
// an approved entity-only account whose entities are gone.
test('a bid with no eligible end-user offers a way forward, not a dead end', async ({ page }) => {
  const supabase = adminClient()
  const { investorId, listingId } = await fixtureIds(supabase)
  await resetInvestorFixture({ signature: 'present', bid: 'absent' })

  // Strip every bidding party: entity-only account, no entities, no individual KYC.
  await supabase.from('kyc_individual').delete().eq('user_id', investorId)
  await supabase.from('kyc_entity').delete().eq('user_id', investorId)
  {
    const { error } = await supabase
      .from('users')
      .update({ kyc_status: 'approved', account_type: 'entity' })
      .eq('id', investorId)

    if (error) throw error
  }

  try {
    await page.goto(`/listings/${listingId}`)
    await page.getByTestId('bid-open-button').click()
    await expect(page.getByTestId('bid-modal')).toBeVisible()

    await expect(page.getByTestId('bid-no-end-users')).toBeVisible()
    await expect(page.getByText(/Complete KYC or add an entity before bidding/)).toBeVisible()
    await expect(page.getByRole('link', { name: 'Complete KYC' })).toHaveAttribute(
      'href',
      '/auth/kyc'
    )

    // No amount field and no submit button, so there is nothing to dead-end on.
    await expect(page.getByTestId('bid-submit-button')).toHaveCount(0)
    await expect(page.getByText('Please choose who this bid is from.')).toHaveCount(0)
  } finally {
    const { error } = await supabase
      .from('users')
      .update({ kyc_status: 'approved', account_type: null })
      .eq('id', investorId)

    if (error) throw error
    await restoreIndividualKyc(supabase, investorId)
  }
})

// The platform is closed until an admin approves the KYC application. New
// accounts start as pending with nothing submitted (account_type is null until
// the first submission), and are sent to the application form.
test('an account that has not applied is sent to the KYC form instead of listings', async ({ page }) => {
  const supabase = adminClient()
  const { investorId } = await fixtureIds(supabase)
  const { error } = await supabase
    .from('users')
    .update({ kyc_status: 'pending', account_type: null })
    .eq('id', investorId)

  if (error) throw error

  try {
    await page.goto('/listings')
    await page.waitForURL(/\/auth\/kyc/)
    await expect(
      page.getByRole('heading', { name: 'Complete your investor application' })
    ).toBeVisible()
    await expect(page.getByText('How are you investing?')).toBeVisible()
    // The gated pages are not linked from the nav either.
    await expect(page.getByRole('link', { name: 'Listings', exact: true })).toHaveCount(0)
  } finally {
    await supabase.from('users').update({ kyc_status: 'approved', account_type: null }).eq('id', investorId)
  }
})

// Once submitted, the applicant sees the confirmation, and both the pages and
// the API stay closed until approval.
test('a submitted application shows under review and the NDA API refuses it', async ({ page }) => {
  const supabase = adminClient()
  const { investorId, listingId } = await fixtureIds(supabase)
  const { error } = await supabase
    .from('users')
    .update({ kyc_status: 'pending', account_type: 'individual' })
    .eq('id', investorId)

  if (error) throw error

  try {
    await page.goto('/auth/kyc')
    await expect(page.getByRole('heading', { name: 'Application under review' })).toBeVisible()
    await expect(page.getByTestId('kyc-under-review')).toContainText(INVESTOR_EMAIL)

    await page.goto(`/listings/${listingId}`)
    await page.waitForURL(/\/auth\/kyc/)

    const res = await page.request.post('/api/nda', {
      data: { listing_id: listingId, signature_image: 'data:image/png;base64,iVBORw0KGgo=' },
    })
    expect(res.status()).toBe(403)
  } finally {
    await supabase.from('users').update({ kyc_status: 'approved', account_type: null }).eq('id', investorId)
  }
})

// Seed an invested position with everything the portfolio module embeds, then verify it renders.
async function seedInvestedPosition() {
  const supabase = adminClient()
  const { investorId, listingId } = await fixtureIds(supabase)

  // NDA (required by funding_rounds / newsfeed RLS) + published + newsfeed enabled.
  await supabase.from('nda_signatures').delete().eq('investor_id', investorId).eq('listing_id', listingId)
  await supabase.from('nda_signatures').insert({
    investor_id: investorId,
    listing_id: listingId,
    signature_image_url: 'https://example.test/e2e-signature.png',
  })
  {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'published', ai_newsfeed_enabled: true })
      .eq('id', listingId)
    if (error) throw error
  }

  // Funding rounds (chart) + newsfeed cache (display; no AI key needed to seed the row).
  await supabase.from('funding_rounds').delete().eq('listing_id', listingId)
  {
    const { error } = await supabase.from('funding_rounds').insert([
      { listing_id: listingId, round_name: 'Seed', valuation: 5_000_000, amount_raised: 1_000_000, event_date: '2023-06-01', sequence_order: 0 },
      { listing_id: listingId, round_name: 'Series A', valuation: 20_000_000, amount_raised: 8_000_000, event_date: '2024-09-01', sequence_order: 1 },
    ])
    if (error) throw error
  }
  await supabase.from('listing_newsfeed').delete().eq('listing_id', listingId)
  {
    const { error } = await supabase.from('listing_newsfeed').insert({
      listing_id: listingId,
      bullets: [{ text: 'E2E newsfeed bullet one.' }, { text: 'E2E newsfeed bullet two.' }],
      disclosure: 'This is AI generated.',
      generated_at: new Date().toISOString(),
    })
    if (error) throw error
  }

  // Invested (active) bid + a bid document.
  await supabase.from('bids').delete().eq('investor_id', investorId).eq('listing_id', listingId)
  const { data: bid, error } = await supabase
    .from('bids')
    .insert({
      investor_id: investorId,
      listing_id: listingId,
      amount: 75000,
      status: 'invested',
      portfolio_status: 'active',
      invested_at: new Date().toISOString(),
      nda_signed: true,
    })
    .select('id')
    .single()
  if (error) throw error
  await supabase.from('associated_documents').insert({
    bid_id: bid.id,
    file_name: 'investment-agreement.pdf',
    file_url: '',
    storage_path: `${bid.id}/seed.pdf`,
    document_type: 'investment_doc',
    uploaded_by: investorId,
    uploaded_at: new Date().toISOString(),
  })
}

test('portfolio shows the invested position with documents, chart, newsfeed, and an Executed badge', async ({ page }) => {
  await seedInvestedPosition()

  await page.goto('/portfolio')
  await expect(page.getByRole('heading', { name: 'Portfolio' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Active' })).toBeVisible()
  await expect(page.getByText(LISTING_NAME)).toBeVisible()
  await expect(page.getByText(/^Executed /)).toBeVisible() // invested-date badge

  // Details (documents, chart, newsfeed) are collapsed by default — expand them.
  await page.getByRole('button', { name: new RegExp(LISTING_NAME) }).click()
  await expect(page.getByText('investment-agreement.pdf')).toBeVisible() // bid documents
  await expect(page.getByText('Series A')).toBeVisible() // funding chart point label
  await expect(page.getByText('AI Newsfeed Summary')).toBeVisible() // newsfeed module
  await expect(page.getByText('E2E newsfeed bullet one.')).toBeVisible()
})

test('newsfeed refresh is forbidden for non-admins', async ({ page }) => {
  const { listingId } = await fixtureIds(adminClient())
  const res = await page.request.post(`/api/listings/${listingId}/newsfeed`)
  expect(res.status()).toBe(403)
})

// A closed listing is viewable but shows as closed with no bid CTA.
test('a closed listing shows as closed with no bid option', async ({ page }) => {
  const supabase = adminClient()
  const { investorId, listingId } = await fixtureIds(supabase)
  await supabase.from('nda_signatures').delete().eq('investor_id', investorId).eq('listing_id', listingId)
  await supabase.from('nda_signatures').insert({
    investor_id: investorId,
    listing_id: listingId,
    signature_image_url: 'https://example.test/e2e-signature.png',
  })
  await supabase.from('listings').update({ status: 'closed' }).eq('id', listingId)

  await page.goto(`/listings/${listingId}`)
  await expect(page.getByText('This listing is closed')).toBeVisible()
  await expect(page.getByTestId('bid-open-button')).toHaveCount(0)

  await supabase.from('listings').update({ status: 'published' }).eq('id', listingId)
})
