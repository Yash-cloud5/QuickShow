import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import { ArrowRightIcon, ClockIcon, Loader2Icon } from 'lucide-react'
import isotimeformat from '../libraries/isotimeformat'
import BlurCircle from '../components/BlurCircle'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'

const SeatLayout = () => {
  const groupRows = [
    ["A", "B"],
    ["C", "D"],
    ["E", "F"],
    ["G", "H"],
    ["I", "J"]
  ]

  const { id, date } = useParams()
  const currency = import.meta.env.VITE_CURRENCY || '$'

  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [show, setShow] = useState(null)
  const [occupiedSeats, setOccupiedSeats] = useState([])
  const [isBooking, setIsBooking] = useState(false)

  const navigate = useNavigate()
  const { axios, getToken, user } = useAppContext()

  const getShow = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/show/${id}`)
      if (data.success) {
        setShow(data)
      } else {
        toast.error(data.message || 'Failed to fetch show details')
      }
    } catch (error) {
      console.error('Error fetching show:', error)
      toast.error(error.response?.data?.message || 'Failed to load show')
    }
  }, [axios, id])

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast.error("Please Select Time First")
    }

    if (occupiedSeats.includes(seatId)) {
      return toast.error('This seat is already Booked')
    }

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast.error("You can only select up to 5 seats")
    }

    setSelectedSeats(prev =>
      prev.includes(seatId)
        ? prev.filter(seat => seat !== seatId)
        : [...prev, seatId]
    )
  }

  const handleTimeSelect = (timeItem) => {
    if (selectedTime?.time !== timeItem.time) {
      setSelectedTime(timeItem)
      setSelectedSeats([])
    }
  }

  const renderSeats = (row, count = 9) => (
    <div key={row} className='flex gap-2 mt-2'>
      <div className='flex flex-wrap items-center justify-center gap-2'>
        {Array.from({ length: count }, (_, i) => {
          const seatId = `${row}${i + 1}`
          const isSelected = selectedSeats.includes(seatId)
          const isOccupied = occupiedSeats.includes(seatId)

          return (
            <button
              key={seatId}
              type="button"
              disabled={isOccupied}
              onClick={() => handleSeatClick(seatId)}
              className={`h-8 w-8 rounded text-xs font-semibold transition-all border
                ${isSelected ? 'bg-primary text-white border-primary shadow-sm shadow-primary/30 scale-105' : ''}
                ${isOccupied ? 'opacity-30 bg-gray-700/50 border-gray-600 cursor-not-allowed text-gray-500' : 'border-primary/50 hover:border-primary cursor-pointer hover:bg-primary/10'}
              `}
            >
              {seatId}
            </button>
          )
        })}
      </div>
    </div>
  )

  const getOccupiedSeats = useCallback(async () => {
    if (!selectedTime?.showId) return
    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`)
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats || [])
      } else {
        toast.error(data.message || 'Failed to load seat availability')
      }
    } catch (error) {
      console.error('Error fetching occupied seats:', error)
    }
  }, [axios, selectedTime])

  const bookTickets = async () => {
    try {
      if (!user) return toast.error('Please Login to Proceed')
      if (!selectedTime) return toast.error('Please select a show timing')
      if (!selectedSeats.length) return toast.error('Please select at least one seat')

      setIsBooking(true)
      const token = await getToken()

      const { data } = await axios.post(
        '/api/booking/create',
        { showId: selectedTime.showId, selectedSeats },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        if (data.url) {
          window.location.href = data.url
        } else {
          toast.success(data.message || 'Booking successful!')
          navigate('/my-bookings')
        }
      } else {
        toast.error(data.message || 'Booking failed')
      }
    } catch (error) {
      console.error('Booking error:', error)
      toast.error(error.response?.data?.message || error.message || 'Booking failed')
    } finally {
      setIsBooking(false)
    }
  }

  useEffect(() => {
    getShow()
  }, [getShow])

  useEffect(() => {
    if (selectedTime) {
      getOccupiedSeats()
    }
  }, [selectedTime, getOccupiedSeats])

  const timings = (show?.dateTime && show.dateTime[date]) ? show.dateTime[date] : []

  return show ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50'>
      {/* Available timings */}
      <div className='w-full md:w-60 bg-primary/10 border border-primary/20 rounded-lg py-8 h-max md:sticky md:top-30'>
        <p className='text-lg font-semibold px-6'>
          Available Timings
        </p>

        <div className='mt-5 space-y-1'>
          {timings.length > 0 ? (
            timings.map((item) => (
              <div
                key={item.time}
                onClick={() => handleTimeSelect(item)}
                className={`flex items-center gap-2 px-6 py-2.5 w-full rounded-r-md cursor-pointer transition
                  ${
                    selectedTime?.time === item.time
                      ? "bg-primary text-white font-medium shadow-md shadow-primary/20"
                      : "hover:bg-primary/20 text-gray-300"
                  }`}
              >
                <ClockIcon className='w-4 h-4' />
                <p className='text-sm'>
                  {isotimeformat(item.time)}
                </p>
              </div>
            ))
          ) : (
            <p className='px-6 text-sm text-gray-400'>No timings for this date</p>
          )}
        </div>
      </div>

      {/* Available seats */}
      <div className='relative flex-1 flex flex-col items-center max-md:mt-16'>
        <BlurCircle top='-100px' left='-100px' />
        <BlurCircle bottom='0' right='0' />
        <h1 className='text-2xl font-semibold mb-2'>
          Select Your Seats
        </h1>
        <p className='text-sm text-gray-400 mb-6'>
          {show.movie?.title || 'Movie'} &bull; {selectedSeats.length > 0 ? `${selectedSeats.length} seat(s) selected (${currency}${(selectedSeats.length * (show.movie?.showPrice || 10))})` : 'Max 5 seats'}
        </p>
        <img
          src={assets.screenImage}
          alt='screen'
          className='w-full max-w-lg'
        />
        <p className='text-gray-400 text-xs tracking-widest mt-2 mb-6'>
          SCREEN SIDE
        </p>
        <div className='flex flex-col items-center mt-6 text-xs text-gray-300'>
          <div className='grid grid-cols-2 md:grid-cols-1 gap-8 md:gap-2 mb-6'>
            {groupRows[0].map(row =>
              renderSeats(row)
            )}
          </div>
          <div className='grid grid-cols-2 gap-11'>
            {groupRows.slice(1).map((group, idx) => (
              <div key={idx}>
                {group.map(row => renderSeats(row))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className='flex items-center gap-6 mt-8 text-xs text-gray-400'>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded border border-primary/50'></div>
            <span>Available</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded bg-primary text-white'></div>
            <span>Selected</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-4 h-4 rounded bg-gray-700/50 border border-gray-600 opacity-40'></div>
            <span>Booked</span>
          </div>
        </div>

        <button
          onClick={bookTickets}
          disabled={isBooking || selectedSeats.length === 0}
          className={`flex items-center gap-2 mt-12 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95 shadow-lg shadow-primary/20 ${
            (isBooking || selectedSeats.length === 0) ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {isBooking ? (
            <>
              <Loader2Icon className='h-4 w-4 animate-spin' />
              Processing Booking...
            </>
          ) : (
            <>
              Proceed To Checkout
              <ArrowRightIcon strokeWidth={2.5} className='h-4 w-4' />
            </>
          )}
        </button>
      </div>
    </div>
  ) : (
    <Loading />
  )
}

export default SeatLayout