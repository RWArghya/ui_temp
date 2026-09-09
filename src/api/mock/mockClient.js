/**
 * Simulates a network round-trip for prototype data. Swap the `fetchX`
 * functions in this folder for real axios calls once the backend exists —
 * callers only ever see a Promise<data>, so nothing else has to change.
 */
export function mockRequest(data, { delay = 650, simulateError = false } = {}) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (simulateError) {
        reject(new Error("Request failed. Please try again."))
      } else {
        resolve(data)
      }
    }, delay)
  })
}
