export interface Template {
  name: string
  url: string
  configuration: string
  directory: string
  instructions: string | string[]
  isQuickstart: boolean
}
