import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    console.log('Testing connection to:', process.env.MONGO_URI?.replace(/:([^@]+)@/, ':****@'));
    try {
        await mongoose.connect(process.env.MONGO_URI!);
        console.log('✅ Connection Successful!');
        process.exit(0);
    } catch (err: any) {
        console.error('❌ Connection Failed!');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        if (err.reason) console.error('Reason:', err.reason);
        process.exit(1);
    }
};

testConnection();
