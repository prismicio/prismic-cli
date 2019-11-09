import Config from './config'

// UI
export const UI = {
  display(message: string | string[]) {
    if (typeof message === 'string') {
      process.stdout.write(`${message}\n`)
    } else if (Array.isArray(message)) {
      process.stdout.write(`${message.join('\n')}\n`)
    }
  },
  debug(message: string) {
    process.stdout.write(`${message}\n`)
  },
  displayErrors(errors: any) {
    if (typeof errors === 'string') {
      process.stdout.write(`${errors}\n`)
    } else {
      const errorsMsg = Object.keys(errors).reduce((acc, field) => {
        const fieldErrors = errors[field]
        return acc.concat(fieldErrors)
      }, [])
      this.display(errorsMsg)
    }
  },
}

// Domain
export const Domain = {
  repository(repository: string, base: string = Config.defaults.baseURL()) {
    const matches = base.match(new RegExp('((https?://)([^/]*))'))
    if (!matches) return ''

    return `${matches[2]}${repository}.${matches[3]}`
  },
  api(base: string, domain: string) {
    return `${this.repository(base, domain)}/api`
  },
}
