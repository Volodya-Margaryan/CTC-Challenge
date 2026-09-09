'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Deletes one visit via DELETE /api/visits/:id, then refreshes the page.
export default function DeleteVisitButton({ visitId }: { visitId: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/visits/${visitId}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
      aria-label="Delete visit"
    >
      {deleting ? '…' : 'remove'}
    </button>
  );
}
