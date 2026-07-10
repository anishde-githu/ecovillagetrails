import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  adminListListings,
  adminApproveListing,
  adminRejectListing,
  adminListPartners,
} from '../controllers/listingController.js';

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/listings', adminListListings); // ?status=pending&category=hotel
router.put('/listings/:id/approve', adminApproveListing);
router.put('/listings/:id/reject', adminRejectListing);
router.get('/partners', adminListPartners);

export default router;
