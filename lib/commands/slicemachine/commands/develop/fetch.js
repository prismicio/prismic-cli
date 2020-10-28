import fetch from 'node-fetch'
import { ctx } from '../../../../context'

const DEFAULT_API_ROUTE = 'https://silo2hqf53.execute-api.us-east-1.amazonaws.com/prod';

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
  const API_ROUTE = ctx.SliceMachine.customTypeEndpoint || DEFAULT_API_ROUTE;

  return new Promise((resolve, reject) => {
    const token = getToken()
    if (!token) {
      throw new Error('Could not parse prismic auth token from cookies')
    }
    fetch(API_ROUTE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        repository: domain,
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
