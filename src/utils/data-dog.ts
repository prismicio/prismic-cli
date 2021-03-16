import axios, {AxiosResponse} from 'axios'
import PrismicCommand from './../prismic/base-command'
import {serializeError} from 'serialize-error'

export default async function datadog(error: string | Error, payload: PrismicCommand): Promise<AxiosResponse> {

  const maybeError = typeof error === 'string' ? {} : serializeError(error)

  const sainPayload = {
    ...maybeError,
    context: {
      ...payload,
      config: {
        ...payload.config,
        plugins: [],
        pjson: {},
      },
    },
  }

  const data = {
    alert_type: 'error',
    priority: 'normal',
    source_type_name: 'NODE',
    host: 'prismic-cli',
    date_happened: Date.now(),
    title: typeof error === 'string' ? error : error.message,
    text: sainPayload,
  }
  return axios.post('https://ykz3r8yyd6.execute-api.us-east-1.amazonaws.com/stage/', data)
}
