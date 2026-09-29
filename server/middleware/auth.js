import { clerkClient, getAuth } from "@clerk/express";

export const protectAdmin = async (req, res, next) => {
    try {
        const auth = getAuth(req);
        const userId = auth?.userId || req.auth?.userId || (typeof req.auth === 'function' ? req.auth()?.userId : null);

        if (!userId) {
            return res.status(401).json({ success: false, message: "not authorized" });
        }

        const user = await clerkClient.users.getUser(userId);

        const meta = {
            ...(user?.unsafeMetadata || {}),
            ...(user?.publicMetadata || {}),
            ...(user?.privateMetadata || {})
        };

        const isAdmin = 
            String(meta.role || '').toLowerCase() === 'admin' ||
            String(meta.user || '').toLowerCase() === 'admin' ||
            meta.isAdmin === true ||
            meta.isAdmin === 'true' ||
            meta.admin === true ||
            meta.admin === 'true';

        if (!isAdmin) {
            console.log(`protectAdmin: User ${userId} (${user?.emailAddresses?.[0]?.emailAddress}) is not an admin. Metadata:`, meta);
            return res.status(403).json({ success: false, message: "not authorized" });
        }

        next();
    } catch (error) {
        console.error("protectAdmin error:", error);
        return res.status(403).json({ success: false, message: "not authorized" });
    }
};