import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';
import { toRestaurant } from '@/lib/types';
import { readJsonBody, validateRestaurantBody } from '@/lib/validation';

/**
 * GET /api/restaurants
 * Returns all restaurants.
 */
export async function GET() {
  try {
    // Bug was here: `ORDER BY createdAt` - the actual column is `created_at`
    // (see the migration), so this threw and the frontend got a 500. Aliasing
    // it to "createdAt" also matches what toRestaurant() expects from the row.
    const { rows } = await pool.query(
      `SELECT id, name, cuisine, address, rating, created_at AS "createdAt"
       FROM restaurants
       ORDER BY created_at DESC`
    );
    return NextResponse.json(rows.map(toRestaurant));
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/restaurants - create a restaurant.
export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const input = validateRestaurantBody(body);

    const { rows } = await pool.query(
      `INSERT INTO restaurants (name, cuisine, address, rating)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, cuisine, address, rating, created_at AS "createdAt"`,
      [input.name, input.cuisine, input.address, input.rating]
    );

    return NextResponse.json(toRestaurant(rows[0]), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
