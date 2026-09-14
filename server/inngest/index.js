import { Inngest } from "inngest";
import User from "../models/Users.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

// Create Inngest client
export const inngest = new Inngest({
    id: "movie-ticket-booking"
});

// ===============================
// Sync user creation from Clerk
// ===============================
const syncUserCreation = inngest.createFunction(
    {
        id: "sync-user-from-clerk",
        triggers: [{ event: "clerk/user.created" }]
    },
    async ({ event }) => {
        const {
            id,
            first_name,
            last_name,
            email_addresses,
            image_url
        } = event.data;

        const name =
            [first_name, last_name].filter(Boolean).join(" ") || "User";

        const email =
            email_addresses?.[0]?.email_address || "";

        const image = image_url || "";

        const userData = {
            _id: id,
            email,
            name,
            image
        };

        await User.findByIdAndUpdate(
            id,
            userData,
            {
                upsert: true,
                new: true
            }
        );

        console.log(
            `User created/synced: ${id} (${email})`
        );
    }
);

// ===============================
// Sync user deletion from Clerk
// ===============================
const syncUserDeletion = inngest.createFunction(
    {
        id: "delete-user-with-clerk",
        triggers: [{ event: "clerk/user.deleted" }]
    },
    async ({ event }) => {
        const { id } = event.data;

        await User.findByIdAndDelete(id);

        console.log(`User deleted: ${id}`);
    }
);

// ===============================
// Sync user updates from Clerk
// ===============================
const syncUserUpdation = inngest.createFunction(
    {
        id: "update-user-from-clerk",
        triggers: [{ event: "clerk/user.updated" }]
    },
    async ({ event }) => {
        const {
            id,
            first_name,
            last_name,
            email_addresses,
            image_url
        } = event.data;

        const name =
            [first_name, last_name].filter(Boolean).join(" ") || "User";

        const email =
            email_addresses?.[0]?.email_address || "";

        const image = image_url || "";

        const userData = {
            _id: id,
            email,
            name,
            image
        };

        await User.findByIdAndUpdate(
            id,
            userData,
            {
                upsert: true,
                new: true
            }
        );

        console.log(
            `User updated: ${id} (${email})`
        );
    }
);

// ==========================================
// Release seats if payment is not completed
// within 10 minutes
// ==========================================
const releaseSeatsAndDeleteBooking = inngest.createFunction(
    {
        id: "release-seats-and-delete-booking",
        triggers: [{ event: "app/checkpayment" }]
    },
    async ({ event, step }) => {

        // Wait for 10 minutes
        const tenMinutesLater = new Date(
            Date.now() + 10 * 60 * 1000
        );

        await step.sleepUntil(
            "wait-for-10-minutes",
            tenMinutesLater
        );

        // Check payment status
        await step.run(
            "check-payment-status",
            async () => {

                const { bookingId } = event.data;

                const booking =
                    await Booking.findById(bookingId);

                // Booking may already have been deleted
                if (!booking) {
                    console.log(
                        `Booking not found: ${bookingId}`
                    );
                    return;
                }

                // Payment completed
                if (booking.isPaid) {
                    console.log(
                        `Booking already paid: ${bookingId}`
                    );
                    return;
                }

                // Find the show
                const show =
                    await Show.findById(booking.show);

                if (!show) {
                    console.log(
                        `Show not found: ${booking.show}`
                    );

                    await Booking.findByIdAndDelete(
                        booking._id
                    );

                    return;
                }

                // Release booked seats
                booking.bookedSeats.forEach((seat) => {
                    delete show.occupiedSeats[seat];
                });

                show.markModified("occupiedSeats");

                await show.save();

                // Delete unpaid booking
                await Booking.findByIdAndDelete(
                    booking._id
                );

                console.log(
                    `Released seats and deleted unpaid booking: ${bookingId}`
                );
            }
        );
    }
);

// Export all Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    releaseSeatsAndDeleteBooking
];
