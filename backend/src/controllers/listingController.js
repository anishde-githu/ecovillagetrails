import Listing, { ROLE_TO_CATEGORY } from '../models/Listing.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { uploadBufferToCloudinary } from '../middleware/upload.js';
import { notifyNewListingSubmitted, notifyListingEdited } from '../config/telegram.js';

/* ---------------------------------------------------------
   PUBLIC (no login required) - what the HTML site calls
--------------------------------------------------------- */

// GET /api/listings?category=hotel&region=Purulia - list approved listings
export async function listPublicListings(req, res) {
  try {
    const filter = Listing.publicFilter(req.query.category);
    if (req.query.region) filter.region = req.query.region;

    const listings = await Listing.find(filter)
      .select('-rejectionReason')
      .sort('-createdAt');
    res.json({ listings });
  } catch (err) {
    console.error('listPublicListings error:', err);
    res.status(500).json({ error: 'Could not load listings.' });
  }
}

// GET /api/listings/:id - single approved listing detail (for the listing page)
export async function getPublicListing(req, res) {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, status: 'approved' });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });
    res.json({ listing });
  } catch (err) {
    res.status(500).json({ error: 'Could not load listing.' });
  }
}

/* ---------------------------------------------------------
   PARTNER (requireAuth, role = owner/agent/guide) - dashboard
   Each partner role can only manage listings in its own category.
--------------------------------------------------------- */

// GET /api/partner/listings - all listings belonging to the logged-in partner (any status)
export async function listMyListings(req, res) {
  const listings = await Listing.find({ owner: req.user._id }).sort('-createdAt');
  res.json({ listings });
}

// POST /api/partner/listings - create a new listing (goes in as "pending")
export async function createMyListing(req, res) {
  try {
    const category = ROLE_TO_CATEGORY[req.user.role];
    if (!category) {
      return res.status(403).json({ error: 'Your account type cannot create listings.' });
    }

    const { name, tagline, description, region, contactPhone, contactEmail, amenities, offerings } = req.body;
    if (!name || !description || !region) {
      return res.status(400).json({ error: 'Name, description and region are required.' });
    }

    const listing = await Listing.create({
      owner: req.user._id,
      category,
      name,
      tagline,
      description,
      region,
      contactPhone,
      contactEmail,
      amenities: amenities || [],
      offerings: offerings || [],
      status: 'pending', // every new listing needs admin approval
    });

    // Fire-and-forget: instant Telegram alert to the developer/admin phone
    notifyNewListingSubmitted(listing, req.user);

    res.status(201).json({ listing });
  } catch (err) {
    console.error('createMyListing error:', err);
    res.status(500).json({ error: 'Could not create listing.' });
  }
}

// PUT /api/partner/listings/:id - edit own listing. Edits re-enter "pending" review.
export async function updateMyListing(req, res) {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    const { name, tagline, description, region, contactPhone, contactEmail, amenities, offerings, coverImageIndex } = req.body;
    if (name !== undefined) listing.name = name;
    if (tagline !== undefined) listing.tagline = tagline;
    if (description !== undefined) listing.description = description;
    if (region !== undefined) listing.region = region;
    if (contactPhone !== undefined) listing.contactPhone = contactPhone;
    if (contactEmail !== undefined) listing.contactEmail = contactEmail;
    if (amenities !== undefined) listing.amenities = amenities;
    if (offerings !== undefined) listing.offerings = offerings;
    if (coverImageIndex !== undefined) listing.coverImageIndex = coverImageIndex;

    // Re-review after a content edit, so admin sees the updated version before it's public again
    listing.status = 'pending';
    listing.rejectionReason = undefined;

    await listing.save();
    notifyListingEdited(listing, req.user);
    res.json({ listing });
  } catch (err) {
    console.error('updateMyListing error:', err);
    res.status(500).json({ error: 'Could not update listing.' });
  }
}

// DELETE /api/partner/listings/:id
export async function deleteMyListing(req, res) {
  const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });

  // Clean up images from Cloudinary too, so we don't leave orphaned files
  for (const img of listing.images) {
    await cloudinary.uploader.destroy(img.publicId).catch(() => {});
  }

  await listing.deleteOne();
  res.json({ message: 'Listing deleted.' });
}

// POST /api/partner/listings/:id/images - upload up to 8 images for own listing
export async function uploadMyListingImages(req, res) {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });
    if (!listing) return res.status(404).json({ error: 'Listing not found.' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded.' });
    }
    if (listing.images.length + req.files.length > 8) {
      return res.status(400).json({ error: 'Maximum 8 images per listing.' });
    }

    const uploaded = await Promise.all(
      req.files.map((file) => uploadBufferToCloudinary(file.buffer, `ecovillage/${listing.category}s`))
    );

    listing.images.push(...uploaded);
    await listing.save();
    res.status(201).json({ listing });
  } catch (err) {
    console.error('uploadMyListingImages error:', err);
    res.status(500).json({ error: 'Image upload failed.' });
  }
}

// DELETE /api/partner/listings/:id/images - body: { publicId } - remove a single image
export async function deleteMyListingImage(req, res) {
  const listing = await Listing.findOne({ _id: req.params.id, owner: req.user._id });
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });

  const { publicId } = req.body;
  if (!publicId) return res.status(400).json({ error: 'publicId is required.' });

  await cloudinary.uploader.destroy(publicId).catch(() => {});
  const removedIndex = listing.images.findIndex((img) => img.publicId === publicId);
  listing.images = listing.images.filter((img) => img.publicId !== publicId);
  if (removedIndex !== -1 && listing.coverImageIndex >= listing.images.length) {
    listing.coverImageIndex = 0;
  }
  await listing.save();
  res.json({ listing });
}

/* ---------------------------------------------------------
   ADMIN (requireAuth, role=admin) - moderation
--------------------------------------------------------- */

// GET /api/admin/listings?status=pending&category=hotel
export async function adminListListings(req, res) {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  const listings = await Listing.find(filter).populate('owner', 'name email phone').sort('-createdAt');
  res.json({ listings });
}

// PUT /api/admin/listings/:id/approve
export async function adminApproveListing(req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  listing.status = 'approved';
  listing.rejectionReason = undefined;
  await listing.save();
  res.json({ listing });
}

// PUT /api/admin/listings/:id/reject  body: { reason }
export async function adminRejectListing(req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found.' });
  listing.status = 'rejected';
  listing.rejectionReason = req.body.reason || 'Did not meet listing guidelines.';
  await listing.save();
  res.json({ listing });
}

// GET /api/admin/partners - list all partner accounts (owner/agent/guide), useful for admin oversight
export async function adminListPartners(req, res) {
  const filter = { role: { $in: ['owner', 'agent', 'guide'] } };
  if (req.query.role) filter.role = req.query.role;
  const partners = await User.find(filter).sort('-createdAt');
  res.json({ partners });
}
