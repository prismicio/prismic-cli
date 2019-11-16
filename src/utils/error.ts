export abstract class AbstractPrismicError extends Error {
  static prefix: string
  constructor(readonly message: string, readonly status: number = -1) {
    super(message)
    const prefix = this.init.prefix
    if (prefix) {
      this.message = `${prefix} ${this.message}`
    }

    Object.setPrototypeOf(this, new.target.prototype)
  }

  get init(): typeof AbstractPrismicError {
    return this.constructor as typeof AbstractPrismicError
  }
}

export const PrismicError = class extends AbstractPrismicError {
  static prefix = '[Prismic Error]:'
}

export const BadRequestError = class extends AbstractPrismicError {
  static prefix = '[Bad Request Error]:'
  readonly status: number = 400
}

export const UnauthorizedError = class extends AbstractPrismicError {
  static prefix = '[Unauthorized Error]:'
  readonly status: number = 401
}

export const ForbiddenError = class extends AbstractPrismicError {
  static prefix = '[Forbidden Error]:'
  readonly status: number = 403
}

export const InternalServerError = class extends AbstractPrismicError {
  static prefix = '[Internal Server Error]:'
  readonly status: number = 500
}

export const UnknownError = class extends AbstractPrismicError {
  static prefix = '[Unknown Error]:'
}
