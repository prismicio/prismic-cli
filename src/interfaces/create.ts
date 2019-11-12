export interface CreateFactoryOptions {
  cache: boolean
  config: string
  template?: string
  theme?: string
  token?: string
  users?: string
  quickstart?: boolean,
  ['skip-prompt']: boolean
  ['skip-config']?: boolean,
}

export type CreateFactory = (
  name: string,
  directory: string,
  method: 'init' | 'new',
  options: CreateFactoryOptions
) => Promise<void>
