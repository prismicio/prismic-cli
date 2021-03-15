export * as fs from './fs'

export function parseJson<T>(jsonString: string): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const obj: T = JSON.parse(jsonString)
      return resolve(obj)
    } catch (error) /* istanbul ignore next */ {
      return reject(error)
    }
  })
}

export function parseJsonSync<T>(jsonString: string): T {
  const obj: T = JSON.parse(jsonString)
  return obj
}

// proxies to prevent mocking of node.js internal functions.

