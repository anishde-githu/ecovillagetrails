// Run this ONCE to create your admin account: node scripts/createAdmin.js
// Reads ADMIN_EMAIL and ADMIN_PASSWORD from your .env file.
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import mongoose from 'mongoose';

async function run() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file first.');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log('An account with this email already exists:', existing.email, '(role:', existing.role + ')');
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await User.create({
    name: 'Site Admin',
    email: email.toLowerCase(),
    passwordHash,
    role: 'admin',
  });

  console.log('Admin account created:', admin.email);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
