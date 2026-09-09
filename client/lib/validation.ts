// Validation helpers used by the API route handlers. Each one either returns
// a clean value or throws a typed error from lib/errors.ts, which
// handleError() turns into the right status code.
import { NotFoundError, ValidationError } from './errors';

const POSITIVE_INTEGER_RE = /^[1-9]\d*$/;

// Per the contract, a bad id ("abc", "-1", "1.5") is a 404, not a 400.
export function parseId(raw: string): number {
  if (!POSITIVE_INTEGER_RE.test(raw)) {
    throw new NotFoundError('Not found');
  }
  return Number(raw);
}

export async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError('Request body must be valid JSON');
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateOptionalString(value: unknown, field: string, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new ValidationError(`"${field}" must be a string`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ValidationError(`"${field}" must be ${maxLength} characters or fewer`);
  }
  return trimmed.length === 0 ? null : trimmed;
}

// --- restaurants ---

export interface RestaurantInput {
  name: string;
  cuisine: string | null;
  address: string | null;
  rating: number | null;
}

function validateRating(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError('"rating" must be a number');
  }
  if (value < 0 || value > 5) {
    throw new ValidationError('"rating" must be between 0 and 5');
  }
  return value;
}

// Used by both POST and PUT - a PUT without a name is invalid, not "leave it alone".
export function validateRestaurantBody(body: unknown): RestaurantInput {
  if (!isPlainObject(body)) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const { name, cuisine, address, rating } = body;

  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('"name" is required and must be a non-empty string');
  }
  if (name.trim().length > 200) {
    throw new ValidationError('"name" must be 200 characters or fewer');
  }

  return {
    name: name.trim(),
    cuisine: validateOptionalString(cuisine, 'cuisine', 200),
    address: validateOptionalString(address, 'address', 300),
    rating: validateRating(rating),
  };
}

// --- visits ---

export interface VisitInput {
  date: string;
  amountSpent: number | null;
  notes: string | null;
}

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function validateDate(value: unknown): string {
  if (typeof value !== 'string' || !DATE_ONLY_RE.test(value)) {
    throw new ValidationError('"date" is required and must be in YYYY-MM-DD format');
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  // new Date() rolls invalid dates like "2026-02-30" forward instead of
  // rejecting them, so compare the parsed date back against the input.
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ValidationError('"date" is not a valid calendar date');
  }
  return value;
}

function validateAmountSpent(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError('"amountSpent" must be a number');
  }
  if (value < 0) {
    throw new ValidationError('"amountSpent" must be zero or greater');
  }
  return value;
}

// restaurantId comes from the URL, not the body - see app/api/restaurants/[id]/visits.
export function validateVisitBody(body: unknown): VisitInput {
  if (!isPlainObject(body)) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const { date, amountSpent, notes } = body;

  return {
    date: validateDate(date),
    amountSpent: validateAmountSpent(amountSpent),
    notes: validateOptionalString(notes, 'notes', 2000),
  };
}
