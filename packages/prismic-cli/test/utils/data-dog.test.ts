import {fancy} from 'fancy-test'
import datadog from '../../src/utils/data-dog'
import PrismicCommand from '../../src/prismic/base-command'

describe('data-dog', () => {
  const now = Date.now()

  fancy
  .stub(Date, 'now', () => now)
  .nock('https://ykz3r8yyd6.execute-api.us-east-1.amazonaws.com', api => {
    api.post('/stage', body => (
      body.alert_type === 'error' &&
      body.priority === 'normal' &&
      body.source_type_name === 'NODE' &&
      body.host === 'prismic-cli' &&
      body.title === 'Test title' &&
      JSON.stringify(body.text) === '{}' &&
      body.date_happened === now
    ))
  })
  .do(async () => {
    return datadog('Test title', {} as PrismicCommand)
  })
  .it('When given a string it should send an error event to the error handling service')

  fancy
  .stub(Date, 'now', () => now)
  .nock('https://ykz3r8yyd6.execute-api.us-east-1.amazonaws.com', api => {
    api.post('/stage', body => (
      body.alert_type === 'error' &&
      body.priority === 'normal' &&
      body.source_type_name === 'NODE' &&
      body.host === 'prismic-cli' &&
      body.title === 'Test title' &&
      body.date_happened === now
    ))
  })
  .do(async () => {
    return datadog(new Error('Test title'), {} as PrismicCommand)
  })
  .it('When given a string it should send an error event to the error handling service')
})
