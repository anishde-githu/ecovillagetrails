import Review from '../models/Review.js';
import Listing from '../models/Listing.js';

// Recalculates and saves a listing's average rating + count
async function refreshListingRating(listingId) {
  const reviews = await Review.find({ listing: listingId, hidden: false });
  const count = reviews.length;
  const avg = count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  await Listing.findByIdAndUpdate(listingId, {
    avgRating: Math.round(avg * 10) / 10,
    reviewCount: count,
  });
}

// GET /api/listings/:id/reviews - public
export async function listListingReviews(req, res) {
  const reviews = await Review.find({ listing: req.params.id, hidden: false }).sort('-createdAt');
  res.json({ reviews });
}

// POST /api/listings/:id/reviews - public, guest leaves a review
export async function createReview(req, res) {
  try {
    const { guestName, guestEmail, rating, comment } = req.body;
    if (!guestName || !guestEmail || !rating) {
      return res.status(400).json({ error: 'Name, email and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    const listing = await Listing.findOne({ _id: req.params.id, status: 'approved' });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    const review = await Review.create({
      listing: listing._id,
      guestName,
      guestEmail,
      rating,
      comment,
    });

    await refreshListingRating(listing._id);
    res.status(201).json({ review });
  } catch (err) {
    console.error('createReview error:', err);
    res.status(500).json({ error: 'Could not submit review.' });
  }
}
