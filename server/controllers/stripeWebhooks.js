import stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";
import { sendConfirmationEmailForBooking } from "../services/emailService.js";

export const stripeWebhooks = async (request, response) => {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers["stripe-signature"];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error) {
        console.error("Webhook signature error:", error.message);
        return response
            .status(400)
            .send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const bookingId = session.metadata?.bookingId;

                if (!bookingId) {
                    console.log("Booking ID not found in session metadata for checkout.session.completed");
                    break;
                }

                const booking = await Booking.findById(bookingId);
                if (!booking) {
                    console.log("Booking not found for bookingId:", bookingId);
                    break;
                }

                if (!booking.isPaid) {
                    booking.isPaid = true;
                    booking.paymentLink = "";
                    await booking.save();
                    console.log("Booking marked as paid via checkout.session.completed:", bookingId);
                }

                // Send Confirmation Email directly & trigger Inngest
                await sendConfirmationEmailForBooking(bookingId);
                try {
                    await inngest.send({
                        name: "app/show.booked",
                        data: { bookingId }
                    });
                } catch (inngestErr) {
                    console.log("Inngest send event note:", inngestErr.message);
                }
                break;
            }

            case "payment_intent.succeeded": {
                const paymentIntent = event.data.object;

                const sessionList =
                    await stripeInstance.checkout.sessions.list({
                        payment_intent: paymentIntent.id,
                    });

                const session = sessionList.data?.[0];

                if (!session) {
                    console.log(
                        "No checkout session found for payment intent:",
                        paymentIntent.id
                    );
                    break;
                }

                const bookingId = session.metadata?.bookingId;

                if (!bookingId) {
                    console.log("Booking ID not found in session metadata for payment_intent.succeeded");
                    break;
                }

                const booking = await Booking.findById(bookingId);
                if (!booking) {
                    console.log("Booking not found for bookingId:", bookingId);
                    break;
                }

                if (!booking.isPaid) {
                    booking.isPaid = true;
                    booking.paymentLink = "";
                    await booking.save();
                    console.log("Booking marked as paid via payment_intent.succeeded:", bookingId);
                }

                // Send Confirmation Email directly & trigger Inngest
                await sendConfirmationEmailForBooking(bookingId);
                try {
                    await inngest.send({
                        name: "app/show.booked",
                        data: { bookingId }
                    });
                } catch (inngestErr) {
                    console.log("Inngest send event note:", inngestErr.message);
                }

                break;
            }

            default:
                console.log(
                    "Unmatched event type:",
                    event.type
                );
        }

        response.json({ received: true });

    } catch (error) {
        console.error("Webhook processing error:", error);
        response.status(500).send("Internal Server Error");
    }
};