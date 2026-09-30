import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";

// Safe TMDB fetch helper with IPv4 and retry logic to avoid TLS/ECONNRESET issues
const fetchTmdbWithRetry = async (url, retries = 3) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_API_KEY}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept-Encoding': 'identity'
                },
                family: 4,
                timeout: 10000
            });
            return response.data;
        } catch (err) {
            if (attempt === retries || err.response?.status === 404) throw err;
            await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        }
    }
};

// API TO GET NOW PLAYING MOVIES FROM TMDB API
export const getNowPlayingMovies = async (req, res) => {
    try {
        const data = await fetchTmdbWithRetry("https://api.themoviedb.org/3/movie/now_playing");
        const movies = data.results || [];

        res.json({
            success: true,
            movies
        });

    } catch (error) {
        console.error("TMDB ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// API TO SEARCH MOVIES FROM TMDB API
export const searchMovies = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim() === '') {
            return res.json({
                success: true,
                movies: []
            });
        }

        const data = await fetchTmdbWithRetry(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query.trim())}&include_adult=false&language=en-US&page=1`
        );
        const movies = data?.results || [];

        res.json({
            success: true,
            movies
        });

    } catch (error) {
        console.error("SEARCH MOVIES ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// API TO ADD A NEW SHOW TO THE DATABASE
export const addShow = async (req, res) => {
    try {
        const { movieId, showsInput, showPrice } = req.body;

        if (!movieId) {
            return res.status(400).json({ success: false, message: "Movie ID is required" });
        }
        if (!showsInput || !Array.isArray(showsInput) || showsInput.length === 0) {
            return res.status(400).json({ success: false, message: "Please provide show dates and times" });
        }
        if (showPrice === undefined || showPrice === null || isNaN(Number(showPrice))) {
            return res.status(400).json({ success: false, message: "Please provide a valid show price" });
        }

        const stringMovieId = String(movieId);
        let movie = await Movie.findById(stringMovieId);

        // If movie doesn't exist in our database
        if (!movie) {
            // FETCH MOVIE DETAILS AND CREDITS FROM TMDB
            const [movieApiData, movieCreditData] = await Promise.all([
                fetchTmdbWithRetry(`https://api.themoviedb.org/3/movie/${stringMovieId}`),
                fetchTmdbWithRetry(`https://api.themoviedb.org/3/movie/${stringMovieId}/credits`).catch(() => ({ cast: [] }))
            ]);

            const formatImageUrl = (path) => {
                if (!path) return "";
                if (path.startsWith("http")) return path;
                return `https://image.tmdb.org/t/p/original${path}`;
            };

            const formattedCasts = (movieCreditData?.cast || []).map((c) => ({
                name: c.name || "Cast Member",
                profile_path: formatImageUrl(c.profile_path)
            }));

            const movieDetails = {
                _id: stringMovieId,
                title: movieApiData.title || "Untitled",
                overview: movieApiData.overview || "",
                poster_path: formatImageUrl(movieApiData.poster_path),
                backdrop_path: formatImageUrl(movieApiData.backdrop_path),
                genres: movieApiData.genres || [],
                casts: formattedCasts,
                release_date: movieApiData.release_date || "",
                original_language: movieApiData.original_language || "en",
                tagline: movieApiData.tagline || "",
                vote_average: movieApiData.vote_average || 0,
                runtime: movieApiData.runtime || 0
            };

            // ADD MOVIE TO DATABASE
            movie = await Movie.create(movieDetails);
        }

        // CREATE SHOWS
        const showsToCreate = [];

        showsInput.forEach((show) => {
            const showDate = show.date;

            (show.time || []).forEach((time) => {
                const dateTimeString = `${showDate}T${time}`;

                showsToCreate.push({
                    movie: stringMovieId,
                    showDateTime: new Date(dateTimeString),
                    showPrice: Number(showPrice),
                    occupiedSeats: {}
                });
            });
        });

        // INSERT SHOWS INTO DATABASE
        if (showsToCreate.length > 0) {
            await Show.insertMany(showsToCreate);
        }

        res.json({
            success: true,
            message: "Show added successfully"
        });

    } catch (error) {
        console.error("ADD SHOW ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// API TO GET ALL SHOWS FROM DATABASE
export const getShows = async (req, res) => {
    try {
        const shows = await Show.find({
            showDateTime: {
                $gte: new Date()
            }
        })
            .populate("movie")
            .sort({
                showDateTime: 1
            });

        // FILTER UNIQUE MOVIES
        const uniqueShows = new Map();

        shows.forEach((show) => {
            if (
                show.movie &&
                !uniqueShows.has(show.movie._id.toString())
            ) {
                uniqueShows.set(
                    show.movie._id.toString(),
                    show.movie
                );
            }
        });

        res.json({
            success: true,
            shows: Array.from(uniqueShows.values())
        });

    } catch (error) {
        console.error("GET SHOWS ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// API TO GET A SINGLE SHOW FROM DATABASE
export const getShow = async (req, res) => {
    try {
        const { movieId } = req.params;

        // GET ALL UPCOMING SHOWS FOR THE MOVIE
        const shows = await Show.find({
            movie: movieId,
            showDateTime: {
                $gte: new Date()
            }
        });

        // GET MOVIE
        const movie = await Movie.findById(movieId);

        if (!movie) {
            return res.status(404).json({
                success: false,
                message: "Movie not found"
            });
        }

        const dateTime = {};

        shows.forEach((show) => {
            const date = show.showDateTime
                .toISOString()
                .split("T")[0];

            if (!dateTime[date]) {
                dateTime[date] = [];
            }

            dateTime[date].push({
                time: show.showDateTime,
                showId: show._id
            });
        });

        res.json({
            success: true,
            movie,
            dateTime
        });

    } catch (error) {
        console.error("GET SHOW ERROR:", error.message);

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};