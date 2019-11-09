declare module 'gittar' {
  import { Stream } from "stream";
  export function fetch(repository: string): Promise<string>
  export function extract(source: string, destination: string, options?: {
    filter(path: string, entry: Stream): boolean
  }): void
}
