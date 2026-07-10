import mongoose from 'mongoose';

// A single "thing you can book" — a room night, a tour package, a guided walk.
// Generic on purpose so Hotels, Travel Agents, and Local Guides can all reuse it.
const offeringSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // "Mud Cottage - Double" / "2-Day Sundarbans Tour" / "Half-day Village Walk"
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, default: 'per night' }, // "per night", "per package", "per day", "per person"
    maxGuests: { type: Number, min: 1, default: 2 },
    available: { type: Boolean, default: true },
  },
  { _id: true }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // Cloudinary id, needed to delete later
  },
  { _id: false }
);

const listingSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Which kind of partner this is — drives labels/icons on the frontend
    category: {
      type: String,
      enum: ['hotel', 'agent', 'guide'],
      required: true,
    },

    name: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true }, // e.g. "Red Earth & Chhau Masks"
    description: { type: String, required: true },
    region: { type: String, required: true, trim: true }, // e.g. "Purulia", "Sundarbans"
    contactPhone: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },

    amenities: [{ type: String, trim: true }], // e.g. ["Solar Power","Organic Meals"] / ["English speaking","4x4 vehicle"]
    images: [imageSchema],
    coverImageIndex: { type: Number, default: 0 }, // which image in `images` is the card/hero cover
    offerings: [offeringSchema], // rooms / tour packages / guide services — same shape, different meaning

    // Moderation: every new/edited listing needs admin approval before going public
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: { type: String },

    // Cached aggregate, recalculated whenever a review is added
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Public listings = only approved ones. Used everywhere the public site queries listings.
listingSchema.statics.publicFilter = function (category) {
  const filter = { status: 'approved' };
  if (category) filter.category = category;
  return filter;
};

// Maps a User role to the single listing category that role is allowed to manage
export const ROLE_TO_CATEGORY = {
  owner: 'hotel',
  agent: 'agent',
  guide: 'guide',
};

export default mongoose.model('Listing', listingSchema);
