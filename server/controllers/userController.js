import { clerkClient, getAuth } from "@clerk/express";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Movie from "../models/Movie.js";


//API controller funstion to get USer bookings
export const getUserBookings = async(req,res)=>{
    try {
        const auth = getAuth(req);
        const user = auth?.userId || req.auth?.userId || (typeof req.auth === 'function' ? req.auth()?.userId : null);
        if (!user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const bookings = await Booking.find({user}).populate({
            path:"show",
            populate:{path:"movie"}
        }).sort({createdAt:-1})
        res.json({success:true,bookings})
    } catch (error) {
        console.error(error);
        res.json({success:false,message:error.message});
    }
}

//API controller function to update favourite movie in Clerk user metadata
export const updateFavourite = async(req,res) => {
    try {
        const { movieId } = req.body;
        const auth = getAuth(req);
        const userId = auth?.userId || req.auth?.userId || (typeof req.auth === 'function' ? req.auth()?.userId : null);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await clerkClient.users.getUser(userId)
        if(!user.privateMetadata.favorites){
            user.privateMetadata.favorites=[]
        }
        if(!user.privateMetadata.favorites.includes(movieId)){
            user.privateMetadata.favorites.push(movieId)
        }else{
            user.privateMetadata.favorites = user.privateMetadata.favorites.filter(item=> item!== movieId)
        }

        await clerkClient.users.updateUserMetadata(userId,{privateMetadata:user.privateMetadata})
        res.json({success:true,message:"Favourites updated successfully..."})
    } catch (error) {
        console.error(error);
        res.json({success:false,message:error.message});
    }
}

export const getFavorites = async(req,res) => {
    try {
        const auth = getAuth(req);
        const userId = auth?.userId || req.auth?.userId || (typeof req.auth === 'function' ? req.auth()?.userId : null);
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const user = await clerkClient.users.getUser(userId)
        const favorites = user.privateMetadata?.favorites || [];

        //Getting movies from database
        const movies = await Movie.find({_id:{$in:favorites}})
        res.json({success:true,movies})
    } catch (error) {
        console.error(error);
        res.json({success:false,message:error.message});
    }
}