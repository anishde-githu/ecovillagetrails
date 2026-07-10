import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import {
  listMyListings,
  createMyListing,
  updateMyListing,
  deleteMyListing,
  uploadMyListingImages,
  deleteMyListingImage,
} from '../controllers/listingController.js';
import { listMyBookings, updateBookingStatus } from '../controllers/bookingController.js';

const router = express.Router();

// Every route here requires a logged-in partner (any of the 3 partner roles)
router.use(requireAuth, requireRole('owner', 'agent', 'guide'));

router.get('/listings', listMyListings);
router.post('/listings', createMyListing);
router.put('/listings/:id', updateMyListing);
router.delete('/listings/:id', deleteMyListing);

router.post('/listings/:id/images', upload.array('images', 8), uploadMyListingImages);
router.delete('/listings/:id/images', deleteMyListingImage); // body: { publicId }

router.get('/bookings', listMyBookings);
router.put('/bookings/:id/status', updateBookingStatus);

export default router;
