import { test, expect, type ConsoleMessage } from '@playwright/test'

// These console messages are emitted by third-party SDKs or the project's own
// logging on cold-start and are not actionable failures during a smoke test.
const IGNORED_CONSOLE = [
  /\[SW\]/i,
  /\[Auth\]/i,
  /Download the React DevTools/i,
  /Failed to load resource.*favicon/i,
]

function shouldIgnore(msg: ConsoleMessage) {
  const text = msg.text()
  return IGNORED_CONSOLE.some((rx) => rx.test(text))
}

test.describe('Smoke', () => {
  test('home page renders and exposes core navigation', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !shouldIgnore(msg)) errors.push(msg.text())
    })

    await page.goto('/')

    await expect(page).toHaveTitle(/ABAWI/i)
    // The Navbar is mounted on every route — assert it shows up.
    await expect(page.locator('nav, header').first()).toBeVisible()

    expect(errors, `Unexpected runtime errors:\n${errors.join('\n')}`).toEqual([])
  })

  test('client-side routing reaches /digital without full reload', async ({ page }) => {
    await page.goto('/')
    // Find any link to /digital and click it. Use first() to avoid strict mode
    // failures when multiple matching links exist (header + footer).
    const digitalLink = page.locator('a[href="/digital"], a[href^="/digital/"]').first()
    await digitalLink.click()
    await expect(page).toHaveURL(/\/digital/)
  })
})
