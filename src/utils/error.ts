export const UnauthorizedError = class extends Error {
  readonly statusCode: number = 401
  constructor(message: string) {
    super(`[Unauthorized Error]: ${message}`)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export const ForbiddenError = class extends Error {
  readonly statusCode: number = 403
  constructor(message: string) {
    super(`[Forbidden Error]: ${message}`)
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export const InternalServerError = class extends Error {
  readonly statusCode: number
  constructor(message: string, statusCode = 500) {
    super(`[Internal Server Error]: ${message}`)

    this.statusCode = statusCode

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export const UnknownError = class extends Error {
  readonly statusCode: number
  constructor(message: string, statusCode = -1) {
    super(`[Unknown Error]: ${message}`)

    this.statusCode = statusCode

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
