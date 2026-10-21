const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/reviews';

export async function getReviews() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Failed to load reviews');
    return res.json();
  } catch {
    return [];
  }
}

export async function addReview(review) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to save review.');
  }
  return res.json();
}

// Returns a map of { [dishName]: { average, count } } from all reviews
export async function getDishRatings() {
  const reviews = await getReviews();
  const totals = {};

  reviews.forEach((review) => {
    (review.dishRatings || []).forEach(({ dish, rating }) => {
      if (!dish || !rating) return;
      if (!totals[dish]) totals[dish] = { sum: 0, count: 0 };
      totals[dish].sum += Number(rating);
      totals[dish].count += 1;
    });
  });

  const result = {};
  Object.keys(totals).forEach((dish) => {
    result[dish] = {
      average: totals[dish].sum / totals[dish].count,
      count: totals[dish].count,
    };
  });

  return result;
}