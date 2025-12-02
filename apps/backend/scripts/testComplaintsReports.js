import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Complaint from '../src/modules/complaints/complaint.model.js';
import Report from '../src/modules/reports/report.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/GreenGrow';

async function testComplaintsReports() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test complaints
    console.log('\n📋 Testing Complaints...');
    const complaints = await Complaint.find({})
      .populate('user', 'name email profileImage')
      .populate('resolvedBy', 'name email')
      .limit(5);
    
    console.log(`Found ${complaints.length} complaints`);
    if (complaints.length > 0) {
      const c = complaints[0];
      console.log('Sample complaint:', {
        id: c._id?.toString(),
        type: c.type,
        title: c.title?.substring(0, 30),
        hasUser: !!c.user,
        user: c.user ? {
          id: c.user._id?.toString(),
          name: c.user.name,
          email: c.user.email,
        } : null,
      });
      
      // Test conversion
      const obj = c.toObject();
      console.log('Converted object:', {
        id: obj._id?.toString(),
        hasUser: !!obj.user,
        user: obj.user,
      });
    }

    // Test reports
    console.log('\n📋 Testing Reports...');
    const reports = await Report.find({})
      .populate('user', 'name email profileImage')
      .populate('resolvedBy', 'name email')
      .limit(5);
    
    console.log(`Found ${reports.length} reports`);
    if (reports.length > 0) {
      const r = reports[0];
      console.log('Sample report:', {
        id: r._id?.toString(),
        type: r.type,
        reason: r.reason,
        hasUser: !!r.user,
        user: r.user ? {
          id: r.user._id?.toString(),
          name: r.user.name,
          email: r.user.email,
        } : null,
      });
      
      // Test conversion
      const obj = r.toObject();
      console.log('Converted object:', {
        id: obj._id?.toString(),
        hasUser: !!obj.user,
        user: obj.user,
      });
    }

    await mongoose.disconnect();
    console.log('\n✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

testComplaintsReports();

