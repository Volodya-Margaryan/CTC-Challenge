'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

// Logs a visit via POST /api/restaurants/:id/visits, then refreshes the page.
export default function VisitForm({ restaurantId }: { restaurantId: number }) {
  const router = useRouter();
  const [date, setDate] = useState('');
  const [amountSpent, setAmountSpent] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          amountSpent: amountSpent.trim() === '' ? null : Number(amountSpent),
          notes: notes.trim() === '' ? null : notes,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Request failed (${res.status})`);
        return;
      }

      setDate('');
      setAmountSpent('');
      setNotes('');
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-medium">Log a visit</h3>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Date
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          />
        </label>
        <label className="text-sm">
          Amount spent ($)
          <input
            type="number"
            step="0.01"
            min="0"
            value={amountSpent}
            onChange={(e) => setAmountSpent(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          />
        </label>
      </div>

      <label className="block text-sm">
        Notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Add visit'}
      </button>
    </form>
  );
}
