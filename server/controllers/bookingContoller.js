import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import { getAuth } from "@clerk/express";
import stripe from 'stripe'


// CHECK WHETHER SELECTED SEATS ARE AVAILABLE
const checkSeatsAvailability = async (showId, selectedSeats) => {
    try {
        const showData = await Show.findById(showId);

        if (!showData) {
            return false;
        }

        const occupiedSeats = showData.occupiedSeats || {};

        const isAnySeatTaken = selectedSeats.some(
            (seat) => occupiedSeats[seat]
        );

        return !isAnySeatTaken;

    } catch (error) {
        console.log(error.message);
        return false;
    }
};


// API TO CREATE A BOOKING
export const createBooking = async (req, res) => {
    try {
        const auth = getAuth(req);
        const userId = auth?.userId || req.auth?.userId || (typeof req.auth === 'function' ? req.auth()?.userId : null);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { showId, selectedSeats } = req.body;
        const { origin } = req.headers;

        // CHECK IF SELECTED SEATS ARE AVAILABLE
        const isAvailable = await checkSeatsAvailability(
            showId,
            selectedSeats
        );

        if (!isAvailable) {
            return res.json({
                success: false,
                message: "Selected seats are not available"
            });
        }


        // GET SHOW DETAILS
        const showData = await Show.findById(showId).populate("movie");

        if (!showData) {
            return res.json({
                success: false,
                message: "Show not found"
            });
        }


        // CREATE A NEW BOOKING
        const booking = await Booking.create({
            user: userId,
            show: showId,
            amount: showData.showPrice * selectedSeats.length,
            bookedSeats: selectedSeats
        });


        // MARK SELECTED SEATS AS OCCUPIED
        selectedSeats.forEach((seat) => {
            showData.occupiedSeats[seat] = userId;
        });


        // TELL MONGOOSE THAT OCCUPIED SEATS WAS MODIFIED
        showData.markModified("occupiedSeats");

        await showData.save();


        // STRIPE PAYMENT GATEWAY WILL BE INITIALIZED HERE
        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

        //Creating line items for stripe
        const line_items =[{
            price_data:{
                currency:'usd',
                product_data:{
                    name:showData.movie.title
                },
                unit_amount:Math.floor(booking.amount)*100
            },
            quantity:1
        }]

        const session = await stripeInstance.checkout.sessions.create({
            success_url:`${origin}/loading/my-bookings`,
            cancel_url:`${origin}/my-bookings`,
            line_items:line_items,
            mode:'payment',
            metadata:{
                bookingId:booking._id.toString()
            },
            expires_at:Math.floor(Date.now()/1000)+30*60,
        })

        booking.paymentLink = session.url
        await booking.save()

        //Run inngest sheduler func. to check payment status after 10 mins
        await innegest.send({
            name:"app/checkpayment",
            data:{
                bookingId : booking_.id.toString()
            }
        })

        res.json({
            success: true,
            url:session.url
        });

    } catch (error) {
        console.log(error.message);

        res.json({
            success: false,
            message: error.message
        });
    }
};


// API TO CREATE PAYMENT SESSION FOR EXISTING BOOKING
export const payBooking = async (req, res) => {
    try {
        const auth = getAuth(req);
        const userId = auth?.userId || req.auth?.userId || (typeof req.auth === 'function' ? req.auth()?.userId : null);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { bookingId } = req.body;
        const { origin } = req.headers;

        const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            populate: { path: 'movie' }
        });

        if (!booking) {
            return res.json({
                success: false,
                message: "Booking not found"
            });
        }

        if (booking.user !== userId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        if (booking.isPaid) {
            return res.json({
                success: false,
                message: "Booking is already paid"
            });
        }

        const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
        const movieTitle = booking.show?.movie?.title || "Movie Ticket Booking";

        const line_items = [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: movieTitle
                },
                unit_amount: Math.floor(booking.amount) * 100
            },
            quantity: 1
        }];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-bookings`,
            cancel_url: `${origin}/my-bookings`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                bookingId: booking._id.toString()
            },
            expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        });

        booking.paymentLink = session.url;
        await booking.save();

        res.json({
            success: true,
            url: session.url
        });

    } catch (error) {
        console.error("Pay booking error:", error.message);
        res.json({
            success: false,
            message: error.message
        });
    }
};

// API TO GET OCCUPIED SEATS
export const getOccupiedSeats = async (req, res) => {
    try {
        const { showId } = req.params;

        const showData = await Show.findById(showId);

        if (!showData) {
            return res.json({
                success: false,
                message: "Show not found"
            });
        }

        const occupiedSeats = Object.keys(
            showData.occupiedSeats || {}
        );

        res.json({
            success: true,
            occupiedSeats
        });

    } catch (error) {
        console.log(error.message);

        res.json({
            success: false,
            message: error.message
        });
    }
};