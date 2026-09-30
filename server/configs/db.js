import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }
    try {
        mongoose.connection.on('connected', () => console.log('Database Connected to', mongoose.connection.name));
        
        let uri = process.env.MONGODB_URI || "";
        if (uri && !uri.includes('/quickshow')) {
            if (uri.includes('?')) {
                const [base, query] = uri.split('?');
                uri = `${base.replace(/\/$/, '')}/quickshow?${query}`;
            } else {
                uri = `${uri.replace(/\/$/, '')}/quickshow`;
            }
        }
        
        await mongoose.connect(uri);
        isConnected = true;
    } catch(error) {
        console.log("Database Connection Error:", error.message);
    }    
}

export default connectDB;