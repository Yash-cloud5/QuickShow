import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const rawBaseUrl = (import.meta.env.VITE_BASE_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');
axios.defaults.baseURL = rawBaseUrl;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();

    const checkClientAdmin = (u) => {
        if (!u) return false;
        const meta = {
            ...(u.unsafeMetadata || {}),
            ...(u.publicMetadata || {})
        };
        return (
            String(meta.role || '').toLowerCase() === 'admin' ||
            String(meta.user || '').toLowerCase() === 'admin' ||
            meta.isAdmin === true ||
            meta.isAdmin === 'true' ||
            meta.admin === true ||
            meta.admin === 'true'
        );
    };

    const [isAdmin, setIsAdmin] = useState(() => checkClientAdmin(user));
    const [isAdminLoading, setIsAdminLoading] = useState(true);
    const [shows, setShows] = useState([]);
    const [favoriteMovies, setFavoriteMovies] = useState([]);
    const image_base_url = (import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/original').trim();

    const location = useLocation();
    const navigate = useNavigate();

    // API to check if user is admin
    const fetchIsAdmin = useCallback(async () => {
        if (!user) {
            setIsAdmin(false);
            setIsAdminLoading(false);
            return false;
        }

        const clientIsAdmin = checkClientAdmin(user);
        if (clientIsAdmin) {
            setIsAdmin(true);
        }

        try {
            const token = await getToken();

            if (!token) {
                if (!clientIsAdmin) setIsAdmin(false);
                setIsAdminLoading(false);
                return clientIsAdmin;
            }

            const { data } = await axios.get(
                "/api/admin/is-admin",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (data?.success && data?.isAdmin) {
                setIsAdmin(true);
                setIsAdminLoading(false);
                return true;
            } else {
                if (!clientIsAdmin) {
                    setIsAdmin(false);
                }
                setIsAdminLoading(false);
                return clientIsAdmin;
            }

        } catch (error) {
            console.error("Error checking admin status:", error);
            if (!clientIsAdmin) {
                setIsAdmin(false);
            }
            setIsAdminLoading(false);
            return clientIsAdmin;
        }
    }, [user, getToken]);

    // API to fetch all shows
    const fetchShows = async () => {
        try {
            const { data } = await axios.get("/api/show/all");

            if (data.success) {
                setShows(data.shows);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.error("Error fetching shows:", error);
        }
    };

    // API to fetch user's favorite movies
    const fetchFavoriteMovies = useCallback(async () => {
        if (!user) return;
        try {
            const token = await getToken();

            const { data } = await axios.get(
                "/api/user/favorites",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (data.success) {
                setFavoriteMovies(data.movies);
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.error(
                "Error fetching favorite movies:",
                error
            );
        }
    }, [user, getToken]);

    // Fetch shows when app loads
    useEffect(() => {
        fetchShows();
    }, []);

    // Fetch user-related data when Clerk user is available
    useEffect(() => {
        if (isLoaded) {
            if (user) {
                const clientAdmin = checkClientAdmin(user);
                if (clientAdmin) {
                    setIsAdmin(true);
                    setIsAdminLoading(false);
                }
                fetchIsAdmin();
                fetchFavoriteMovies();
            } else {
                setIsAdmin(false);
                setIsAdminLoading(false);
                setFavoriteMovies([]);
            }
        }
    }, [isLoaded, user, fetchIsAdmin, fetchFavoriteMovies]);

    const value = {
        axios,
        fetchIsAdmin,
        fetchShows,
        fetchFavoriteMovies,
        user,
        getToken,
        navigate,
        isAdmin,
        isAdminLoading,
        shows,
        favoriteMovies,
        image_base_url
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);

export default AppProvider;
