import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Loading from '../components/Loading'
import BlurCircle from '../components/BlurCircle'
import timeformat from '../libraries/timeformat'
import { dateformat } from '../libraries/dateformat'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { TicketIcon, FilmIcon, CreditCardIcon, Loader2Icon } from 'lucide-react'

const MyBooking = () => {
  const currency = import.meta.env.VITE_CURRENCY || '$'
  const navigate = useNavigate()

  const { axios, getToken, user, image_base_url } = useAppContext()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [payingId, setPayingId] = useState(null)

  const getMyBookings = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      const { data } = await axios.get('/api/user/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setBookings(data.bookings || [])
      } else {
        toast.error(data.message || 'Failed to fetch bookings')
      }
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast.error(error.response?.data?.message || error.message || 'Failed to load bookings')
    } finally {
      setIsLoading(false)
    }
  }, [axios, getToken])

  const handlePay = async (booking) => {
    if (booking.paymentLink) {
      window.location.href = booking.paymentLink
      return
    }

    try {
      setPayingId(booking._id)
      const token = await getToken()
      const { data } = await axios.post(
        '/api/booking/pay',
        { bookingId: booking._id },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.message || 'Failed to initialize payment')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Payment initiation failed')
    } finally {
      setPayingId(null)
    }
  }

  useEffect(() => {
    if (user) {
      getMyBookings()
    } else {
      setIsLoading(false)
    }
  }, [user, getMyBookings])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 pb-20 min-h-[80vh]'>
      <BlurCircle top='100px' left='100px' />
      <BlurCircle bottom='0px' left='600px' />

      <div className='max-w-3xl relative z-10'>
        <div className='flex items-center gap-3 mb-6'>
          <TicketIcon className='w-6 h-6 text-primary' />
          <h1 className='text-2xl font-semibold'>My Bookings</h1>
        </div>

        {bookings.length === 0 ? (
          <div className='flex flex-col items-center justify-center text-center py-20 bg-primary/5 border border-primary/20 rounded-xl p-8'>
            <FilmIcon className='w-16 h-16 text-gray-500 mb-4' />
            <h2 className='text-xl font-medium mb-2'>No Bookings Found</h2>
            <p className='text-gray-400 text-sm max-w-md mb-6'>
              You haven't booked any movie tickets yet. Browse available shows and book your favorite seats!
            </p>
            <button
              onClick={() => navigate('/movies')}
              className='bg-primary hover:bg-primary-dull transition px-6 py-2.5 rounded-full text-sm font-medium cursor-pointer active:scale-95 shadow-md shadow-primary/20'
            >
              Explore Movies
            </button>
          </div>
        ) : (
          <div className='space-y-4'>
            {bookings.map((item, index) => {
              const movie = item?.show?.movie
              const showDateTime = item?.show?.showDateTime
              const seats = Array.isArray(item?.bookedSeats)
                ? item.bookedSeats
                : (item?.bookedSeats ? Object.keys(item.bookedSeats) : [])
              const posterUrl = movie?.poster_path ? (movie.poster_path.startsWith('http') ? movie.poster_path : `${image_base_url}${movie.poster_path}`) : ''

              return (
                <div
                  key={item._id || index}
                  className='flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 hover:border-primary/40 transition-all rounded-xl p-3 md:p-4 backdrop-blur-sm'
                >
                  <div className='flex flex-col sm:flex-row gap-4'>
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={movie?.title || 'Movie Poster'}
                        className='w-full sm:w-36 aspect-video sm:aspect-3/4 object-cover object-center rounded-lg shadow-md'
                      />
                    ) : (
                      <div className='w-full sm:w-36 aspect-video sm:aspect-3/4 bg-primary/10 rounded-lg flex items-center justify-center text-gray-500'>
                        <FilmIcon className='w-8 h-8' />
                      </div>
                    )}

                    <div className='flex flex-col justify-between py-1'>
                      <div>
                        <h2 className='text-lg font-semibold line-clamp-1'>
                          {movie?.title || 'Movie Booking'}
                        </h2>
                        {movie?.runtime ? (
                          <p className='text-gray-400 text-xs mt-1'>
                            {timeformat(movie.runtime)}
                          </p>
                        ) : null}
                      </div>

                      <div className='mt-3 sm:mt-auto'>
                        <p className='text-xs text-gray-400 uppercase tracking-wider'>Show Time</p>
                        <p className='text-sm text-gray-200 font-medium'>
                          {showDateTime ? dateformat(showDateTime) : 'Timing TBA'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col justify-between md:items-end mt-4 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-primary/10'>
                    <div className='flex items-center justify-between md:justify-end gap-3'>
                      <p className='text-2xl font-bold text-primary'>
                        {currency}{item?.amount || 0}
                      </p>
                      {item?.isPaid ? (
                        <span className='bg-green-500/20 border border-green-500/40 text-green-400 text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1'>
                          Paid
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePay(item)}
                          disabled={payingId === item._id}
                          className={`bg-primary hover:bg-primary-dull transition px-4 py-1.5 text-xs rounded-full font-semibold cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md shadow-primary/20 ${
                            payingId === item._id ? 'opacity-70 cursor-not-allowed' : ''
                          }`}
                        >
                          {payingId === item._id ? (
                            <>
                              <Loader2Icon className='w-3.5 h-3.5 animate-spin' />
                              Opening Stripe...
                            </>
                          ) : (
                            <>
                              <CreditCardIcon className='w-3.5 h-3.5' />
                              Pay Now
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className='text-xs mt-3 md:mt-auto space-y-1 md:text-right bg-primary/5 md:bg-transparent p-2 md:p-0 rounded-lg'>
                      <p>
                        <span className='text-gray-400'>Total Tickets: </span>
                        <span className='font-semibold text-white'>{seats.length}</span>
                      </p>
                      <p>
                        <span className='text-gray-400'>Seat Numbers: </span>
                        <span className='font-semibold text-white'>{seats.join(', ') || 'None'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBooking