import Booking from '../models/Booking.js';
import Listing from '../models/Listing.js';

// POST /api/bookings - guest submits a booking/enquiry request (public, no login)
export async function createBooking(req, res) {
  try {
    const { listingId, offeringId, guestName, guestEmail, guestPhone, checkIn, checkOut, guests, notes } = req.body;

    if (!listingId || !guestName || !guestEmail || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Listing, name, email, check-in and check-out are required.' });
    }

    const listing = await Listing.findOne({ _id: listingId, status: 'approved' });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ error: 'Check-out must be after check-in.' });
    }

    const booking = await Booking.create({
      listing: listing._id,
      offering: offeringId || undefined,
      guestName,
      guestEmail,
      guestPhone,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guests || 1,
      notes,
    });

    // Email sending (to guest + partner) is wired up in a later step.
    res.status(201).json({ booking });
  } catch (err) {
    console.error('createBooking error:', err);
    res.status(500).json({ error: 'Could not create booking request.' });
  }
}

// GET /api/partner/bookings - all bookings for listings the logged-in partner runs
export async function listMyBookings(req, res) {
  const myListings = await Listing.find({ owner: req.user._id }).select('_id');
  const listingIds = myListings.map((l) => l._id);

  const bookings = await Booking.find({ listing: { $in: listingIds } })
    .populate('listing', 'name category')
    .sort('-createdAt');
  res.json({ bookings });
}

// PUT /api/partner/bookings/:id/status  body: { status }
export async function updateBookingStatus(req, res) {
  const { status } = req.body;
  if (!['confirmed', 'declined', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const booking = await Booking.findById(req.params.id).populate('listing');
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (booking.listing.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Not your booking.' });
  }

  booking.status = status;
  await booking.save();
  res.json({ booking });
}
