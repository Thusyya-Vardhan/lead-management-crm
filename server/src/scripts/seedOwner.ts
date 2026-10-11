import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from '../models/User.js';

const seedOwner = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini_crm';

  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoURI);

    // 1. Check if an Owner already exists (Idempotent check)
    const existingOwner = await User.findOne({ role: 'OWNER' });
    if (existingOwner) {
      console.log(`⚠️  Owner already exists: ${existingOwner.email} (ID: ${existingOwner._id})`);
      console.log('Skipping seed.');
      return;
    }

    // 2. Read initial credentials from environment variables
    const name = process.env.INITIAL_OWNER_NAME || 'System Owner';
    const email = process.env.INITIAL_OWNER_EMAIL || 'owner@minicrm.com';
    const rawPassword = process.env.INITIAL_OWNER_PASSWORD;

    if (!rawPassword) {
      throw new Error('INITIAL_OWNER_PASSWORD is not defined in environment variables');
    }

    // 3. Hash the raw password using bcrypt (10 salt rounds)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(rawPassword, saltRounds);

    // 4. Create the Owner record
    const owner = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'OWNER',
      isActive: true,
    });

    console.log('✅ Initial Owner created successfully!');
    console.log(`   ID:    ${owner._id}`);
    console.log(`   Name:  ${owner.name}`);
    console.log(`   Email: ${owner.email}`);
    console.log(`   Role:  ${owner.role}`);
  } catch (error) {
    console.error('❌ Failed to seed Owner:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

seedOwner();
