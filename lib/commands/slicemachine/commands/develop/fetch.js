import fetch from 'node-fetch'
import { ctx } from '../../../../context'

const API_ROUTE = 'http://localhost:4401/dev/slices'

function getToken() {
  const maybeAuth = ctx.cookies
    .split('; ')
    .find(row => row.startsWith('prismic-auth'))
  if (maybeAuth) {
    return maybeAuth.split('=')[1]
  }
  return null
}

export const fetchCtsApi = (domain) => {
  return new Promise((resolve, reject) => {
    const token = getToken()
    // if (!token) {
    //   throw new Error('Could not parse prismic auth token from cookies')
    // }
    fetch(`${API_ROUTE}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        REPOSITORY: domain,
        // DBID: 'aaaa-1b4058d6-e151-4004-aed5-69f44da6abd9_3',
        Authorization: `Bearer ${token}`
      }
    }).then(res => res.json())
    .then(resolve)
    .catch(err => {
      reject(err)
    })
  })
}
