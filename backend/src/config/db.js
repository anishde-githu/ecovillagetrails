import mongoose from 'mongoose';
import dns from 'node:dns';

// Workaround for a known Windows + Node.js issue where Node's own DNS resolver
// fails SRV lookups (querySrv ECONNREFUSED) even though the OS resolver works fine.
// Forcing Node to use Google's public DNS servers fixes it in almost all cases.
// IMPORTANT: only apply this locally on Windows — on hosts like Render, outbound
// queries to arbitrary DNS servers can be blocked/slow, which can hang the Mongo
// connection (and therefore the whole server) at startup.
if (process.platform === 'win32' && !process.env.RENDER) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('Missing MONGODB_URI in .env file. See .env.example.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
}