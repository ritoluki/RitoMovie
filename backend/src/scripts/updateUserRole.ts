import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../../.env') });

import User from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ritomovie';

async function updateUserRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get email from command line argument
    const email = process.argv[2];
    const role = process.argv[3] || 'admin';

    if (!email) {
      console.log('\n📌 Usage: npx ts-node src/scripts/updateUserRole.ts <email> [role]');
      console.log('\n📌 Available roles: user, analyst, moderator, admin, super_admin');
      console.log('\n📌 Example: npx ts-node src/scripts/updateUserRole.ts admin@example.com super_admin');
      
      // List all users
      console.log('\n👥 Current users in database:');
      const users = await User.find().select('name email role isBanned');
      if (users.length === 0) {
        console.log('   No users found');
      } else {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} - ${user.name} [${user.role}]${user.isBanned ? ' 🚫 BANNED' : ''}`);
        });
      }
      
      await mongoose.disconnect();
      process.exit(0);
    }

    // Validate role
    const validRoles = ['user', 'analyst', 'moderator', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      console.error(`❌ Invalid role: ${role}`);
      console.log(`   Valid roles: ${validRoles.join(', ')}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      await mongoose.disconnect();
      process.exit(1);
    }

    const oldRole = user.role;
    user.role = role as any;
    await user.save();

    console.log(`\n✅ User role updated successfully!`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${oldRole} → ${role}`);
    console.log(`\n🔑 User can now access admin panel at /admin`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

updateUserRole();
