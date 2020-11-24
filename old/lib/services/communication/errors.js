/* eslint-disable max-classes-per-file */
export const UnauthorizedError = class extends Error {
  constructor(msg) {
    super();
    return {
      statusCode: 401,
      msg: `[Unauthorized Error]: ${msg}`,
    };
  }
};

export const ForbiddenError = class extends Error {
  constructor(msg) {
    super();
    return {
      statusCode: 403,
      msg: `[Forbidden Error]: ${msg}`,
    };
  }
};

export const InternalServerError = class extends Error {
  constructor(msg) {
    super();
    return {
      statusCode: 500,
      msg: `[Internal Server Error]: ${msg}`,
    };
  }
};

export const UnknownError = class extends Error {
  constructor(statusCode, msg) {
    super();
    return {
      statusCode,
      msg: `[Unknown Error]: ${msg}`,
    };
  }
};
