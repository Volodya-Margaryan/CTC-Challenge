import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRestaurantVisits } from '@/lib/apiClient';
import DeleteVisitButton from './DeleteVisitButton';
import VisitForm from './VisitForm';

export default async function RestaurantPage({ params }: { params: { id: string } }) {
  const restaurantRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/restaurants/${params.id}`, {
    cache: 'no-store',
  });

  if (restaurantRes.status === 404) {
    notFound();
  }
  if (!restaurantRes.ok) {
    throw new Error(`Failed to load restaurant (${restaurantRes.status})`);
  }

  const restaurant = await restaurantRes.json();
  const { totalSpent, visits } = await getRestaurantVisits(params.id);

  return (
    <div>
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        ← All restaurants
      </Link>

      <div className="mt-3 flex items-baseline justify-between">
        <h2 className="text-lg font-medium">{restaurant.name}</h2>
        <span className="text-sm text-gray-500">{restaurant.rating}★</span>
      </div>
      <div className="mt-1 text-sm text-gray-600">
        {restaurant.cuisine} · {restaurant.address}
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
        <div className="text-sm text-gray-500">Total spent here</div>
        <div className="text-2xl font-semibold">${totalSpent.toFixed(2)}</div>
      </div>

      <h3 className="mt-6 mb-2 text-sm font-medium text-gray-700">Visits</h3>
      {visits.length === 0 ? (
        <p className="text-sm text-gray-500">No visits logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {visits.map((visit) => (
            <li
              key={visit.id}
              className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-3 text-sm"
            >
              <div>
                <div className="font-medium">{visit.date}</div>
                {visit.notes && <div className="text-gray-600">{visit.notes}</div>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-700">
                  {visit.amountSpent !== null ? `$${visit.amountSpent.toFixed(2)}` : '—'}
                </span>
                <DeleteVisitButton visitId={visit.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <VisitForm restaurantId={Number(params.id)} />
    </div>
  );
}
