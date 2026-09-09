import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { toVisit } from '@/lib/types';
import { parseId, readJsonBody, validateVisitBody } from '@/lib/validation';

type Params = { params: { id: string } };

async function assertRestaurantExists(restaurantId: number): Promise<void> {
  const { rows } = await pool.query('SELECT id FROM restaurants WHERE id = $1', [restaurantId]);
  if (rows.length === 0) {
    throw new NotFoundError('Restaurant not found');
  }
}

// GET /api/restaurants/:id/visits - visits for one restaurant, plus total spent.
export async function GET(_req: Request, { params }: Params) {
  try {
    const restaurantId = parseId(params.id);
    await assertRestaurantExists(restaurantId);

    const { rows } = await pool.query(
      `SELECT id, "restaurantId", date, "amountSpent", notes, created_at AS "createdAt"
       FROM visits
       WHERE "restaurantId" = $1
       ORDER BY date ASC, id ASC`,
      [restaurantId]
    );

    const visits = rows.map(toVisit);
    const totalSpent = visits.reduce((sum, v) => sum + (v.amountSpent ?? 0), 0);

    return NextResponse.json({ restaurantId, totalSpent, visits });
  } catch (err) {
    return handleError(err);
  }
}

// POST /api/restaurants/:id/visits - log a visit against this restaurant.
export async function POST(req: Request, { params }: Params) {
  try {
    const restaurantId = parseId(params.id);
    await assertRestaurantExists(restaurantId);

    const body = await readJsonBody(req);
    const input = validateVisitBody(body);

    const { rows } = await pool.query(
      `INSERT INTO visits ("restaurantId", date, "amountSpent", notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, "restaurantId", date, "amountSpent", notes, created_at AS "createdAt"`,
      [restaurantId, input.date, input.amountSpent, input.notes]
    );

    return NextResponse.json(toVisit(rows[0]), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
