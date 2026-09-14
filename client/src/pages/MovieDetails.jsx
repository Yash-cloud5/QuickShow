import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BlurCircle from '../components/BlurCircle'
import { HeartIcon, PlayCircleIcon, StarIcon } from 'lucide-react'
import timeformat from '../libraries/timeformat'
import DateSelect from '../components/DateSelect'
import MovieCard from '../components/MovieCard'
import Loading from '../components/Loading'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MovieDetails = () => {

  const navigate = useNavigate()
  const { id } = useParams()

  const [show, setShow] = useState(null)

  const {
    shows,
    axios,
    getToken,
    user,
    fetchFavoriteMovies,
    favoriteMovies,
    image_base_url
  } = useAppContext()


  // GET MOVIE DETAILS
  const getShow = async () => {
    try {

      const { data } = await axios.get(`/api/show/${id}`)

      if (data.success) {
        setShow(data)
      }

    } catch (error) {

      console.log('Error fetching movie:', error)

      toast.error(
        error.response?.data?.message || 'Failed to load movie'
      )

    }
  }


  // ADD / REMOVE FAVORITE
  const handleFavorite = async () => {

    try {

      // Check login
      if (!user) {
        return toast.error('Please login to proceed')
      }

      // Get Clerk token
      const token = await getToken()

      // Send movie ID to backend
      const { data } = await axios.post(
        '/api/user/update-favorite',
        {
          movieId: id
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      // If successful
      if (data.success) {

        // Refresh favorite movies
        await fetchFavoriteMovies()

        toast.success(data.message)
      }

    } catch (error) {

      console.log('Favorite error:', error)

      toast.error(
        error.response?.data?.message || 'Something went wrong'
      )
    }
  }


  // GET MOVIE WHEN ID CHANGES
  useEffect(() => {
    getShow()
  }, [id])


  // LOADING
  if (!show) {
    return <Loading />
  }


  return (

    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">

      {/* MOVIE DETAILS */}

      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">

        {/* POSTER */}

        <img
          src={image_base_url + show.movie.poster_path}
          alt="movie poster"
          className="max-md:mx-auto rounded-xl h-104 max-w-70 object-cover"
        />


        {/* MOVIE INFORMATION */}

        <div className="relative flex flex-col gap-3">

          <BlurCircle
            top="-100px"
            left="-100px"
          />


          {/* LANGUAGE */}

          <p className="text-primary">
            ENGLISH
          </p>


          {/* TITLE */}

          <h1 className="text-4xl font-semibold max-w-96 text-balance">
            {show.movie.title}
          </h1>


          {/* RATING */}

          <div className="flex items-center gap-2 text-gray-300">

            <StarIcon
              className="w-5 h-5 text-primary fill-primary"
            />

            {show.movie.vote_average.toFixed(1)} User Rating

          </div>


          {/* OVERVIEW */}

          <p className="text-gray-400 mt-2 text-sm leading-tight max-w-xl">
            {show.movie.overview}
          </p>


          {/* MOVIE INFORMATION */}

          <p>

            {timeformat(show.movie.runtime)}

            {' . '}

            {show.movie.genres
              .map(genre => genre.name)
              .join(', ')
            }

            {' . '}

            {show.movie.release_date.split('-')[0]}

          </p>


          {/* BUTTONS */}

          <div className="flex items-center flex-wrap gap-4 mt-4">


            {/* TRAILER BUTTON */}

            <button
              className="
                flex items-center gap-2
                px-7 py-3
                text-sm
                bg-gray-800
                hover:bg-gray-900
                transition
                rounded-md
                font-medium
                cursor-pointer
                active:scale-95
              "
            >

              <PlayCircleIcon className="w-5 h-5" />

              Watch Trailer

            </button>


            {/* BUY TICKETS */}

            <a
              href="#dateSelect"
              className="
                px-10 py-3
                text-sm
                bg-primary
                hover:bg-primary-dull
                transition
                rounded-md
                font-medium
                cursor-pointer
                active:scale-95
              "
            >
              Buy Tickets
            </a>


            {/* FAVORITE BUTTON */}

            <button
              onClick={handleFavorite}
              className="
                bg-gray-700
                p-2.5
                rounded-full
                transition
                cursor-pointer
                active:scale-95
              "
            >

              <HeartIcon
                className={`w-5 h-5 ${
                  favoriteMovies.some(
                    movie =>
                      String(movie._id) === String(id)
                  )
                    ? 'fill-primary text-primary'
                    : ''
                }`}
              />

            </button>

          </div>

        </div>

      </div>


      {/* MOVIE CAST */}

      <p className="text-lg font-medium mt-20">
        Movie Cast
      </p>


      <div
        className="
          overflow-x-auto
          no-scrollbar
          mt-8
          pb-4
          relative
          z-10
        "
      >

        <div className="flex items-center gap-4 w-max px-4">

          {show.movie.casts
            .slice(0, 12)
            .map((cast, index) => (

              <div
                key={index}
                className="flex flex-col items-center text-center"
              >

                <img
                  src={cast.profile_path}
                  alt={cast.name}
                  className="
                    rounded-full
                    h-20
                    md:h-20
                    aspect-square
                    object-cover
                  "
                />

                <p className="font-medium text-xs mt-3">
                  {cast.name}
                </p>

              </div>

            ))
          }

        </div>

      </div>


      {/* DATE SELECT */}

      <DateSelect
        dateTime={show.dateTime}
        id={id}
      />


      {/* RECOMMENDED MOVIES */}

      <p className="text-lg font-medium mt-20 mb-8">
        You May Also Like
      </p>


      <div
        className="
          flex
          flex-wrap
          max-sm:justify-center
          gap-8
          relative
          z-10
        "
      >

        {shows
          .slice(0, 4)
          .map((movie) => (

            <MovieCard
              key={movie._id}
              movie={movie}
            />

          ))
        }

      </div>


      {/* SHOW MORE */}

      <div className="flex justify-center mt-20">

        <button
          onClick={() => {
            navigate('/movies')
            scrollTo(0, 0)
          }}
          className="
            px-10 py-3
            text-sm
            bg-primary
            hover:bg-primary-dull
            transition
            rounded-md
            font-medium
            cursor-pointer
          "
        >
          Show More
        </button>

      </div>

    </div>
  )
}

export default MovieDetails
