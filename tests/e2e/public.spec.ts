import { expect, test } from '@playwright/test'

// The app is authenticated-only (migration 011): the landing is the sole public
// surface; listings and detail pages redirect signed-out visitors away.

test('landing loads for signed-out visitors', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'IONIC home' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Get started' }).first()).toBeVisible()
})

test('listings require authentication (signed-out cannot see the grid)', async ({ page }) => {
  await page.goto('/listings')

  // Gated: the listings grid is never shown to signed-out visitors.
  await expect(page.getByRole('heading', { name: 'Active Listings' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible()
})

test('a listing detail requires authentication', async ({ page }) => {
  await page.goto('/listings/00000000-0000-0000-0000-000000000000')

  await expect(page.getByRole('heading', { name: 'Active Listings' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Sign in' }).first()).toBeVisible()
})
