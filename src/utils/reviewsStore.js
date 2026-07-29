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