import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User, UserRole } from '../models/User.js';

interface SeedUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const defaultUsers: SeedUserData[] = [
  {
    name: process.env.INITIAL_ADMIN_NAME || 'Main Admin',
    email: (process.env.INITIAL_ADMIN_EMAIL || 'admin@minicrm.com').toLowerCase().trim(),
    password: process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!',
    role: 'ADMIN',
  },
  {
    name: process.env.INITIAL_EMPLOYEE_NAME || 'Sales Employee',
    email: (process.env.INITIAL_EMPLOYEE_EMAIL || 'employee@minicrm.com').toLowerCase().trim(),
    password: process.env.INITIAL_EMPLOYEE_PASSWORD || 'EmployeePassword123!',
    role: 'EMPLOYEE',
  },
];

const seedUsers = async (): Promise<void> => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mini_crm';

  try {
    console.log('Connecting to database...');
    await mongoose.connect(mongoURI);

    // Clean up any legacy OWNER user from previous tests
    await User.deleteMany({ role: 'OWNER' as any });

    const saltRounds = 10;

    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email} (${existingUser.role}) - Skipping`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      const createdUser = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        isActive: true,
      });

      console.log(`✅ Seeded ${createdUser.role}: ${createdUser.email} (ID: ${createdUser._id})`);
    }

    console.log('🎉 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Failed to seed users:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

seedUsers();
