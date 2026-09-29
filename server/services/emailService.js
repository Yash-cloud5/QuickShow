import Booking from "../models/Booking.js";
import User from "../models/Users.js";
import sendEmail from "../configs/nodeMailer.js";
import { clerkClient } from "@clerk/express";

/**
 * Send a ticket confirmation email for a confirmed/paid booking.
 * Idempotent: will not send duplicate emails if emailSent is true.
 * Safely fetches user details from MongoDB or falls back to Clerk API.
 */
export const sendConfirmationEmailForBooking = async (bookingId) => {
    try {
        if (!bookingId) {
            console.error("sendConfirmationEmailForBooking: Missing bookingId");
            return { error: "Missing bookingId" };
        }

        const rawBooking = await Booking.findById(bookingId);
        if (!rawBooking) {
            console.log(`sendConfirmationEmailForBooking: Booking not found for id ${bookingId}`);
            return { error: `Booking not found: ${bookingId}` };
        }

        // Avoid duplicate emails
        if (rawBooking.emailSent) {
            console.log(`Confirmation email already sent for booking: ${bookingId}`);
            return { success: true, message: "Confirmation email already sent" };
        }

        const booking = await Booking.findById(bookingId)
            .populate({
                path: "show",
                populate: {
                    path: "movie",
                    model: "Movie"
                }
            })
            .populate("user");

        // Retain the raw Clerk userId string in case populate('user') returned null
        const userId = rawBooking.user || (typeof booking?.user === "string" ? booking.user : (booking?.user?._id || booking?.user));

        let userEmail = booking?.user?.email;
        let userName = booking?.user?.name || "Movie Lover";

        // If email not found on populated user, fetch directly from Clerk API
        if (!userEmail && userId) {
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress;
                userName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || clerkUser?.username || "Movie Lover";

                // Cache / sync user to MongoDB
                if (userEmail) {
                    await User.findByIdAndUpdate(
                        userId,
                        {
                            _id: userId,
                            email: userEmail,
                            name: userName,
                            image: clerkUser?.imageUrl || ""
                        },
                        { upsert: true, new: true }
                    );
                }
            } catch (clerkErr) {
                console.error(`Failed to fetch user (${userId}) from Clerk:`, clerkErr.message);
            }
        }

        if (!userEmail) {
            console.error(`User email not found for booking: ${bookingId}`);
            return { error: `User email not found for booking: ${bookingId}` };
        }

        const movieTitle = booking?.show?.movie?.title || "Movie Ticket";
        const seatsText = Array.isArray(booking?.bookedSeats) ? booking.bookedSeats.join(", ") : (booking?.bookedSeats || "N/A");
        
        let showDate = "Timing TBA";
        let showTime = "Timing TBA";
        if (booking?.show?.showDateTime) {
            try {
                showDate = new Date(booking.show.showDateTime).toLocaleDateString("en-US", {
                    timeZone: "Asia/Kolkata",
                    dateStyle: "full"
                });
                showTime = new Date(booking.show.showDateTime).toLocaleTimeString("en-US", {
                    timeZone: "Asia/Kolkata",
                    timeStyle: "short"
                });
            } catch (dtErr) {
                showDate = String(booking.show.showDateTime);
            }
        }

        const amountPaid = booking?.amount || 0;

        await sendEmail({
            to: userEmail,
            subject: `Payment Confirmation: ${movieTitle} booked!`,
            body: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #F84565; margin-top: 0;">Booking Confirmed! 🎉</h2>
                <p>Hi <strong>${userName}</strong>,</p>
                <p>
                    Your booking for
                    <strong style="color: #F84565; font-size: 16px;">
                        ${movieTitle}
                    </strong>
                    has been successfully confirmed.
                </p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 6px 0;"><strong>🎬 Movie:</strong> ${movieTitle}</p>
                    <p style="margin: 6px 0;"><strong>📅 Date:</strong> ${showDate}</p>
                    <p style="margin: 6px 0;"><strong>⏰ Time:</strong> ${showTime}</p>
                    <p style="margin: 6px 0;"><strong>🎟️ Seats:</strong> <span style="color: #F84565; font-weight: bold;">${seatsText}</span></p>
                    <p style="margin: 6px 0;"><strong>💳 Amount Paid:</strong> $${amountPaid}</p>
                </div>
                <p>
                    Enjoy the show! 🍿
                </p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #888; margin: 0;">
                    Thanks for booking with QuickShow!<br />
                    The QuickShow Team
                </p>
            </div>`
        });

        // Mark booking as email sent to prevent duplicate notifications
        rawBooking.emailSent = true;
        await rawBooking.save();

        console.log(`Booking confirmation email successfully sent to ${userEmail} for booking ${bookingId}`);
        return { success: true, to: userEmail };
    } catch (error) {
        console.error(`Error in sendConfirmationEmailForBooking (${bookingId}):`, error);
        return { error: error.message };
    }
};
