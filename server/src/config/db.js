import dns from "node:dns";
import mongoose from "mongoose";

export async function connectDB() {
  // Some Windows setups leave Node's resolver pointed at 127.0.0.1, which breaks
  // mongodb+srv:// SRV lookups. DNS_SERVERS lets us override it (comma-separated).
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(",").map((s) => s.trim()));
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
