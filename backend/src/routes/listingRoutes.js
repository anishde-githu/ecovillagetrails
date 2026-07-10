import express from 'express';
import { listPublicListings, getPublicListing } from '../controllers/listingController.js';
import { listListingReviews, createReview } from '../controllers/reviewController.js';

const router = express.Router();

router.get('/', listPublicListings); // ?category=hotel|agent|guide&region=...
router.get('/:id', getPublicListing);
router.get('/:id/reviews', listListingReviews);
router.post('/:id/reviews', createReview);

export default router;
