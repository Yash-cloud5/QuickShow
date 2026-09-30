import React, { useEffect, useState, useCallback } from 'react' 
import { CheckIcon, DeleteIcon, StarIcon, SearchIcon, XIcon, FilmIcon, SparklesIcon, Loader2Icon } from 'lucide-react' 
import { dummyShowsData } from '../../assets/assets'; 
import Loading from '../../components/Loading'; 
import Title from '../../components/admin/Title'; 
import { kConverter } from '../../libraries/kconverter'; 
import toast from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
 
const AddShows = () => { 
  const currency = import.meta.env.VITE_CURRENCY || '$'
  const { axios, getToken, user, image_base_url, fetchShows } = useAppContext()
  
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]); 
  const [selectedMovie, setSelectedMovie] = useState(null); 
  const [selectedMovieObj, setSelectedMovieObj] = useState(null);
  const [dateTimeSelection, setDateTimeSelection] = useState({}); 
  const [dateTimeInput, setDateTimeInput] = useState(""); 
  const [showPrice, setShowPrice] = useState(""); 
  const [addingShow, setAddingShow] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search feature states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState("now-playing"); // 'now-playing' | 'search'
 
  const fetchNowPlayingMovies = useCallback(async () => { 
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get('/api/show/now-playing', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success && data.movies?.length > 0) {
        setNowPlayingMovies(data.movies);
      } else {
        setNowPlayingMovies(dummyShowsData);
      }
    } catch (error) {
      console.error('Error fetching movies:', error);
      setNowPlayingMovies(dummyShowsData);
    } finally {
      setLoading(false);
    }
  }, [axios, getToken]); 

  useEffect(() => {
    fetchNowPlayingMovies();
  }, [fetchNowPlayingMovies, user]); 

  // Function to search movie on TMDB
  const handleSearchMovie = async (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      toast.error("Please enter a movie title to search");
      return;
    }

    try {
      setIsSearching(true);
      setHasSearched(true);
      setActiveTab("search");
      const token = await getToken();
      const { data } = await axios.get(`/api/show/search-movie?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        setSearchResults(data.movies || []);
        if ((data.movies || []).length === 0) {
          toast('No movies found matching your search.', { icon: '🔍' });
        }
      } else {
        toast.error(data.message || "Failed to search movies");
      }
    } catch (error) {
      console.error("Error searching movies:", error);
      toast.error(error.response?.data?.message || "Failed to search movies");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setActiveTab("now-playing");
  };

  const handleSelectMovie = (movie) => {
    const movieId = movie._id || movie.id;
    if (String(selectedMovie) === String(movieId)) {
      setSelectedMovie(null);
      setSelectedMovieObj(null);
    } else {
      setSelectedMovie(movieId);
      setSelectedMovieObj(movie);
    }
  };

  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;
    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;
    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (!times.includes(time)) {
        return { ...prev, [date]: [...times, time] };
      }
      return prev;
    });
  };

  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);
      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [date]: filteredTimes,
      };
    });
  };

  const handleAddShows = async () => {
    if (!selectedMovie) return toast.error("Please select a movie first");
    if (!showPrice || Number(showPrice) <= 0) return toast.error("Please enter a valid show price");
    const formattedShows = Object.entries(dateTimeSelection).map(([date, times]) => ({
      date,
      time: times
    }));
    if (formattedShows.length === 0) return toast.error("Please add at least one date & time slot");

    try {
      setAddingShow(true);
      const token = await getToken();
      const { data } = await axios.post('/api/show/add', {
        movieId: selectedMovie,
        showsInput: formattedShows,
        showPrice: Number(showPrice)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message || "Show added successfully!");
        setDateTimeSelection({});
        setShowPrice("");
        setSelectedMovie(null);
        setSelectedMovieObj(null);
        setDateTimeInput("");
        if (fetchShows) {
          fetchShows();
        }
      } else {
        toast.error(data.message || "Failed to add show");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setAddingShow(false);
    }
  };

  const renderMovieCard = (movie) => {
    const movieId = movie._id || movie.id;
    const isSelected = String(selectedMovie) === String(movieId);
    const posterSrc = movie.poster_path?.startsWith('http')
      ? movie.poster_path
      : movie.poster_path
      ? ((image_base_url || 'https://image.tmdb.org/t/p/original') + movie.poster_path)
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60';

    return (
      <div 
        key={movieId}  
        className={`relative max-w-40 w-full cursor-pointer rounded-lg transition-all duration-300 transform hover:-translate-y-1 ${
          isSelected 
            ? 'ring-2 ring-primary shadow-lg shadow-primary/30 scale-[1.02]' 
            : 'hover:opacity-90 opacity-80 hover:opacity-100'
        }`} 
        onClick={() => handleSelectMovie(movie)}
      > 
        <div className='relative rounded-lg overflow-hidden bg-gray-900 border border-white/10'>
          <img 
            src={posterSrc} 
            alt={movie.title || 'Movie Poster'} 
            className='w-full h-56 object-cover brightness-90 rounded-lg'
            loading="lazy"
          /> 

          <div className='text-xs flex items-center justify-between p-2 bg-black/80 backdrop-blur-sm w-full absolute bottom-0 left-0'> 
            <p className='flex items-center gap-1 text-gray-300 font-medium'> 
              <StarIcon className="w-3.5 h-3.5 text-primary fill-primary"/> 
              {movie.vote_average ? Number(movie.vote_average).toFixed(1) : '0.0'} 
            </p> 
            <p className='text-gray-400'>{kConverter(movie.vote_count || 0)} votes</p> 
          </div> 
        </div>

        {isSelected && ( 
          <div className='absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded-full shadow-md z-10 animate-scale-up'> 
            <CheckIcon className='w-4 h-4 text-white' strokeWidth={2.5}/> 
          </div> 
        )} 
        <p className='font-medium truncate mt-2 text-white text-sm' title={movie.title}>{movie.title}</p> 
        <p className='text-gray-400 text-xs'>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</p> 
      </div> 
    );
  };

  return !loading ? ( 
    <div className='max-w-6xl pb-16'> 
      <Title text1="Add" text2="Shows"/> 
      
      {/* Search Bar Section */}
      <div className='mt-8 bg-primary/10 border border-primary/20 p-4 md:p-6 rounded-xl relative backdrop-blur-sm'>
        <div className='flex items-center gap-2 mb-3'>
          <SparklesIcon className='w-5 h-5 text-primary' />
          <h2 className='text-lg font-semibold text-white'>Search Any Movie to Add</h2>
        </div>
        <p className='text-sm text-gray-400 mb-4'>
          Search any movie from TMDB database (e.g. Inception, Avatar, Dune, Avengers) to schedule its shows.
        </p>

        <form onSubmit={handleSearchMovie} className='flex flex-col sm:flex-row gap-3 max-w-3xl'>
          <div className='relative flex-1'>
            <SearchIcon className='absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input 
              type='text' 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search movie by title (e.g. Interstellar, Oppenheimer, Batman)...' 
              className='w-full pl-10 pr-10 py-2.5 bg-black/40 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors text-sm'
            />
            {searchQuery && (
              <button 
                type='button' 
                onClick={handleClearSearch}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white'
              >
                <XIcon className='w-4 h-4' />
              </button>
            )}
          </div>
          
          <button 
            type='submit' 
            disabled={isSearching}
            className='bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50'
          >
            {isSearching ? (
              <>
                <Loader2Icon className='w-4 h-4 animate-spin' />
                Searching...
              </>
            ) : (
              <>
                <SearchIcon className='w-4 h-4' />
                Search Movie
              </>
            )}
          </button>
        </form>
      </div>

      {/* Selected Movie Banner */}
      {selectedMovieObj && (
        <div className='mt-6 p-4 bg-primary/20 border border-primary rounded-xl flex items-center justify-between flex-wrap gap-4 animate-fade-in'>
          <div className='flex items-center gap-4'>
            <img 
              src={
                selectedMovieObj.poster_path?.startsWith('http')
                  ? selectedMovieObj.poster_path
                  : selectedMovieObj.poster_path
                  ? ((image_base_url || 'https://image.tmdb.org/t/p/original') + selectedMovieObj.poster_path)
                  : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=60'
              } 
              alt={selectedMovieObj.title}
              className='w-12 h-16 object-cover rounded shadow-md'
            />
            <div>
              <div className='flex items-center gap-2'>
                <span className='px-2 py-0.5 text-xs bg-primary text-white rounded font-medium'>Selected Movie</span>
                <span className='text-xs text-gray-400'>{selectedMovieObj.release_date || 'N/A'}</span>
              </div>
              <h3 className='text-lg font-bold text-white mt-0.5'>{selectedMovieObj.title}</h3>
              <p className='text-xs text-gray-400 line-clamp-1 max-w-xl'>{selectedMovieObj.overview || 'Ready to configure showtimes.'}</p>
            </div>
          </div>
          <button 
            onClick={() => { setSelectedMovie(null); setSelectedMovieObj(null); }}
            className='text-xs text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md transition-colors'
          >
            Change Movie
          </button>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className='mt-8 flex items-center gap-3 border-b border-gray-800 pb-3'>
        <button 
          type='button'
          onClick={() => setActiveTab("now-playing")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "now-playing" 
              ? 'bg-primary text-white shadow-md' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <FilmIcon className='w-4 h-4' />
          Now Playing Movies ({nowPlayingMovies.length})
        </button>

        <button 
          type='button'
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            activeTab === "search" 
              ? 'bg-primary text-white shadow-md' 
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <SearchIcon className='w-4 h-4' />
          Search Results {hasSearched && `(${searchResults.length})`}
        </button>
      </div>

      {/* Movies Grid / Carousel */}
      <div className='mt-6'>
        {activeTab === "now-playing" ? (
          <div>
            <p className='text-sm text-gray-400 mb-3'>Click on any movie below to select it for adding showtimes:</p>
            <div className='overflow-x-auto pb-4'> 
              <div className='flex flex-wrap gap-4 w-max'> 
                {nowPlayingMovies.map((movie) => renderMovieCard(movie))} 
              </div> 
            </div> 
          </div>
        ) : (
          <div>
            {isSearching ? (
              <div className='flex flex-col items-center justify-center py-12 text-gray-400'>
                <Loader2Icon className='w-8 h-8 animate-spin text-primary mb-3' />
                <p>Searching TMDB movie database...</p>
              </div>
            ) : hasSearched ? (
              searchResults.length > 0 ? (
                <div>
                  <p className='text-sm text-gray-400 mb-3'>Found {searchResults.length} movies. Click on a movie to select it:</p>
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'>
                    {searchResults.map((movie) => renderMovieCard(movie))}
                  </div>
                </div>
              ) : (
                <div className='text-center py-12 border border-dashed border-gray-800 rounded-xl'>
                  <SearchIcon className='w-10 h-10 text-gray-600 mx-auto mb-3' />
                  <p className='text-gray-300 font-medium'>No movies found for "{searchQuery}"</p>
                  <p className='text-gray-500 text-sm mt-1'>Check your spelling or try searching another movie title.</p>
                </div>
              )
            ) : (
              <div className='text-center py-12 border border-dashed border-gray-800 rounded-xl'>
                <SearchIcon className='w-10 h-10 text-gray-600 mx-auto mb-3' />
                <p className='text-gray-300 font-medium'>Search for any movie using the search bar above</p>
                <p className='text-gray-500 text-sm mt-1'>You can search any global, regional, or classic movie from TMDB.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Show Details Configuration */}
      <div className='mt-10 pt-8 border-t border-gray-800'>
        <h3 className='text-lg font-semibold text-white mb-4'>Configure Show Details</h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-sm font-medium mb-2 text-gray-300'>Show Price</label>
            <div className='inline-flex items-center gap-2 border border-gray-700 bg-black/30 px-3 py-2.5 rounded-lg w-full max-w-xs focus-within:border-primary'>
              <p className='text-gray-400 text-sm font-medium'>{currency}</p>
              <input 
                min={0} 
                type='number' 
                value={showPrice} 
                onChange={(e) => setShowPrice(e.target.value)} 
                placeholder='Enter Show Price (e.g. 15)' 
                className='outline-none bg-transparent text-white w-full text-sm' 
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2 text-gray-300'>Select Date and Time Slot</label>
            <div className='flex gap-3 max-w-md'>
              <input 
                type='datetime-local' 
                value={dateTimeInput} 
                onChange={(e) => setDateTimeInput(e.target.value)} 
                className='outline-none rounded-lg bg-black/30 border border-gray-700 px-3 py-2 text-white text-sm flex-1 focus:border-primary'
              />
              <button 
                type='button'
                onClick={handleDateTimeAdd}
                className='bg-primary/90 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-primary cursor-pointer transition-colors shrink-0'
              >
                Add Slot
              </button>
            </div>
          </div>
        </div>

        {/* Display Selected Times */}
        {Object.keys(dateTimeSelection).length > 0 && (
          <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl">
            <h4 className="text-sm font-semibold text-gray-300 mb-3">Scheduled Showtimes</h4>
            <div className="space-y-3">
              {Object.entries(dateTimeSelection).map(([date, times]) => (
                <div key={date} className='bg-black/40 p-3 rounded-lg border border-gray-800'>
                  <div className="font-medium text-sm text-primary mb-2">📅 {date}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {times.map((time) => (
                      <div
                        key={time}
                        className="bg-primary/15 border border-primary/40 text-gray-200 px-2.5 py-1 flex items-center gap-2 rounded-md"
                      >
                        <span>🕒 {time}</span>
                        <DeleteIcon
                          onClick={() => handleRemoveTime(date, time)}
                          width={14}
                          className="text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                          title="Remove time slot"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button 
          onClick={handleAddShows} 
          disabled={addingShow || !selectedMovie} 
          className='bg-primary text-white font-medium px-8 py-3 mt-8 rounded-lg hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20'
        >
          {addingShow ? (
            <>
              <Loader2Icon className='w-4 h-4 animate-spin' />
              Adding Show to Database...
            </>
          ) : (
            `Add Shows ${selectedMovieObj ? `for "${selectedMovieObj.title}"` : ''}`
          )}
        </button>
      </div>
    </div> 
  ) : ( 
    <Loading/> 
  );
};
 
export default AddShows;