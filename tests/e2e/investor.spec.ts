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
