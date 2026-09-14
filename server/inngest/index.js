import { Inngest } from "inngest";
import User from "../models/Users.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest function to save user data to a database
const syncUserCreation = inngest.createFunction(
    {
        id: "sync-user-from-clerk",
        triggers: [{ event: "clerk/user.created" }]
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;

        const name = [first_name, last_name].filter(Boolean).join(" ") || "User";
        const email = email_addresses?.[0]?.email_address || "";
        const image = image_url || "";

        const userData = {
            _id: id,
            email,
            name,
            image
        };

        await User.findByIdAndUpdate(id, userData, { upsert: true, new: true });
        console.log(`User created/synced: ${id} (${email})`);
    }
);

// Inngest function to delete user data from a database
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

// Inngest function to update user data in a database
const syncUserUpdation = inngest.createFunction(
    {
        id: "update-user-from-clerk",
        triggers: [{ event: "clerk/user.updated" }]
    },
    async ({ event }) => {
        const { id, first_name, last_name, email_addresses, image_url } = event.data;

        const name = [first_name, last_name].filter(Boolean).join(" ") || "User";
        const email = email_addresses?.[0]?.email_address || "";
        const image = image_url || "";

        const userData = {
            _id: id,
            email,
            name,
            image
        };

        await User.findByIdAndUpdate(id, userData, { upsert: true, new: true });
        console.log(`User updated: ${id} (${email})`);
    }
);

export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation
];