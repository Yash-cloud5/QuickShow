import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

export const AppContext = createContext();

export const AppProvider = ({ children }) => {

    const [isAdmin, setIsAdmin] = useState(false);
    const [isAdminLoading, setIsAdminLoading] = useState(true);
    const [shows, setShows] = useState([]);
    const [favoriteMovies, setFavoriteMovies] = useState([]);
    const image_base_url = import.meta.env.VITE_TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p/original';

    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();

    const location = useLocation();
    const navigate = useNavigate();

    // API to check if user is admin
    const fetchIsAdmin = useCallback(async () => {
        if (!user) {
            setIsAdmin(false);
            setIsAdminLoading(false);
            return false;
        }

        try {
            setIsAdminLoading(true);
            const token = await getToken();

            if (!token) {
                setIsAdmin(false);
                setIsAdminLoading(false);
                return false;
            }

            const { data } = await axios.get(
                "/api/admin/is-admin",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (data.success && data.isAdmin) {
                setIsAdmin(true);
                setIsAdminLoading(false);
                return true;
            } else {
                setIsAdmin(false);
                setIsAdminLoading(false);
                if (location.pathname.startsWith("/admin")) {
                    navigate("/");
                    toast.error(
                        "You are not authorised to access admin dashboard"
                    );
                }
                return false;
            }

        } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
            setIsAdminLoading(false);
            if (location.pathname.startsWith("/admin")) {
                navigate("/");
                toast.error(
                    "You are not authorised to access admin dashboard"
                );
            }
            return false;
        }
    }, [user, getToken, location.pathname, navigate]);

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
                fetchIsAdmin();
                fetchFavoriteMovies();
            } else {
                setIsAdmin(false);
                setIsAdminLoading(false);
                setFavoriteMovies([]);
            }
        }
    }, [isLoaded, user]);

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
