import { after } from 'next/server'

/**
 * Run `task` after the response has been sent. On Vercel a plain
 * fire-and-forget promise can be frozen as soon as the response is returned,
 * so e-mails started that way may never be sent; `after()` keeps the function
 * alive until the task settles. The response still doesn't wait for the task,
 * so its timing reveals nothing (e.g. whether an account exists).
 *
 * Outside a Next.js request (route handlers called directly in tests) `after`
 * throws, so the task is started immediately instead.
 */
export function runAfterResponse(task: () => Promise<unknown>, label: string): void {
  const run = () =>
    task().catch((error) => {
      console.error(`[${label}] background task failed:`, error)
    })
  try {
    after(run)
  } catch {
    void run()
  }
}
