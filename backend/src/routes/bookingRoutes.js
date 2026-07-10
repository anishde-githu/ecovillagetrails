import express from 'express';
import { createBooking } from '../controllers/bookingController.js';

const router = express.Router();

// Public: any guest can submit a booking request, no login required
router.post('/', createBooking);

export default router;
