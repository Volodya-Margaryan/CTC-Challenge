import { NextResponse } from 'next/server';

// Central place to turn an error into an HTTP response. Route handlers throw
// one of these from validation/lookups and call handleError() in their catch
// block instead of building the response themselves.

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Not found') {
    super(message, 404);
  }
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  // Don't leak stack traces / raw db errors - log for us, generic 500 for the caller.
  console.error('Unhandled API error:', err);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
