import { clerkClient, getAuth } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
    try {
        const auth = getAuth(req);
        const userId = auth?.userId || req.auth?.userId || (typeof req.auth === 'function' ? req.auth()?.userId : null);

        if (!userId) {
            return res.status(401).json({ success: false, message: "not authorized" });
        }

        const user = await clerkClient.users.getUser(userId);

        const isAdmin = user?.privateMetadata?.role === 'admin' || user?.publicMetadata?.role === 'admin';

        if (!isAdmin) {
            return res.status(403).json({ success: false, message: "not authorized" });
        }

        next();
    } catch (error) {
        console.error("protectAdmin error:", error);
        return res.status(403).json({ success: false, message: "not authorized" });
    }
};