import fetch from 'node-fetch'
import { ctx } from '../../../../context'

const DEFAULT_API_ROUTE = 'http://localhost:4401/dev/slices';

function getToken() {
  const maybeAuth = ctx.cookies
    .split(';')
    .find(row => row.startsWith('prismic-auth'))
  if (maybeAuth) {
    return maybeAuth.trim().split('=')[1]
  }
  return null
} 

export const fetchCtsApi = (domain) => {
  const API_ROUTE = ctx.SliceMahine.customTypeEndpoint || DEFAULT_API_ROUTE;

  return new Promise((resolve, reject) => {
    const token = getToken()
    if (!token) {
      throw new Error('Could not parse prismic auth token from cookies')
    }
    fetch(`${API_ROUTE}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        REPOSITORY: domain,
        Authorization: `Bearer ${token}`
      }
    })
    .then((res) => {
      if (res.status > 209) {
        return reject(new Error(`[slices API]: ${res.statusText}`))
      }
      resolve(res)
    })
    .catch(reject)
  })
}
