import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { toVisit } from '@/lib/types';
import { parseId } from '@/lib/validation';

type Params = { params: { id: string } };

// GET /api/visits/:id
export async function GET(_req: Request, { params }: Params) {
  try {
    const id = parseId(params.id);

    const { rows } = await pool.query(
      `SELECT id, "restaurantId", date, "amountSpent", notes, created_at AS "createdAt"
       FROM visits
       WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Visit not found');
    }

    return NextResponse.json(toVisit(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

// DELETE /api/visits/:id
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = parseId(params.id);

    const { rowCount } = await pool.query('DELETE FROM visits WHERE id = $1', [id]);

    if (rowCount === 0) {
      throw new NotFoundError('Visit not found');
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
