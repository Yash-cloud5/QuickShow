import mongoose from "mongoose";

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => console.log('Database Connected to', mongoose.connection.name));
        
        let uri = process.env.MONGODB_URI || "";
        if (!uri.includes('/quickshow')) {
            if (uri.includes('?')) {
                const [base, query] = uri.split('?');
                uri = `${base.replace(/\/$/, '')}/quickshow?${query}`;
            } else {
                uri = `${uri.replace(/\/$/, '')}/quickshow`;
            }
        }
        
        await mongoose.connect(uri);
    } catch(error) {
        console.log("Database Connection Error:", error.message);
    }    
}

export default connectDB;