const STORAGE_KEY = "eurasia_reviews";

export function getReviews() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addReview(review) {
  const current = getReviews();
  const updated = [...current, { ...review, date: new Date().toISOString() }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Returns a map of { [dishName]: { average, count } } from all reviews' per-dish ratings
export function getDishRatings() {
  const reviews = getReviews();
  const totals = {}; // { dishName: { sum, count } }

  reviews.forEach((review) => {
    (review.dishRatings || []).forEach(({ dish, rating }) => {
      if (!dish || !rating) return; // skip un-rated dishes (rating 0)
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