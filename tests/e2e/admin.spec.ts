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

test('/admin/bids transitions a bid', async ({ page }) => {
  console.log('[playwright admin] running with seeded admin storageState')
  await resetBidFixture()

  await page.goto('/admin/bids')

  await expect(page.getByRole('heading', { name: 'Bid Management' })).toBeVisible()
  await page.getByTestId('admin-bid-status-accepted').first().click()
  await expect(page.getByText('accepted').first()).toBeVisible()
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
