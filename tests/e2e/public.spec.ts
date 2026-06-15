import { expect, test } from '@playwright/test'

test('home loads', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Venture Marketplace' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Browse Listings' })).toBeVisible()
})

test('/listings renders a grid or empty state', async ({ page }) => {
  await page.goto('/listings')

  await expect(page.getByRole('heading', { name: 'Active Listings' })).toBeVisible()

  const emptyState = page.getByText('No active listings at this time.')
  const listingLink = page.locator('main').getByRole('link').first()

  await expect(emptyState.or(listingLink)).toBeVisible()
})

test('a listing detail shows the NDA gate', async ({ page }) => {
  await page.goto('/listings')

  const emptyState = page.getByText('No active listings at this time.')
  if (await emptyState.isVisible()) {
    test.skip(true, 'No published listings are available for public detail coverage')
  }

  await page.locator('main').getByRole('link').first().click()

  await expect(page.getByText('Sign the NDA to unlock valuation, deal terms, and financial details')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sign in to view details' })).toBeVisible()
})
