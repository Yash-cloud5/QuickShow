import React, { useEffect, useState, useCallback } from 'react'
import Loading from '../../components/Loading'
import Title from '../../components/admin/Title'
import { dateformat } from '../../libraries/dateformat'
import { useAppContext } from '../../context/AppContext'

const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY || '$'

  const { axios, getToken, user } = useAppContext()

  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const getAllBookings = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) {
        setIsLoading(false)
        return
      }
      const { data } = await axios.get('/api/admin/all-bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (data.success) {
        setBookings(data.bookings || [])
      }
    } catch (error) {
      console.error('Error fetching admin bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [axios, getToken])

  useEffect(() => {
    if (user) {
      getAllBookings()
    } else {
      setIsLoading(false)
    }
  }, [user, getAllBookings])

  return !isLoading ? (
    <>
      <Title text1="List" text2="Bookings" />

      <div className='max-w-4xl mt-6 overflow-x-auto'>
        {bookings.length === 0 ? (
          <p className='text-gray-400 py-8 text-center bg-primary/5 rounded-lg border border-primary/20'>
            No bookings found yet.
          </p>
        ) : (
          <table className='w-full border-collapse rounded-md overflow-hidden text-nowrap'>
            <thead>
              <tr className='bg-primary/20 text-left text-white'>
                <th className='p-2 font-medium pl-5'>User Name</th>
                <th className='p-2 font-medium'>Movie Name</th>
                <th className='p-2 font-medium'>Show-Time</th>
                <th className='p-2 font-medium'>Seats</th>
                <th className='p-2 font-medium'>Amount</th>
              </tr>
            </thead>

            <tbody className='text-sm font-light'>
              {bookings.map((item, index) => {
                const seats = Array.isArray(item.bookedSeats)
                  ? item.bookedSeats.join(', ')
                  : Object.keys(item.bookedSeats || {}).join(', ')

                return (
                  <tr key={item._id || index} className='border-b border-primary/20 bg-primary/5 even:bg-primary/10'>
                    <td className='p-2 min-w-45 pl-5'>{item.user?.name || (typeof item.user === 'string' ? item.user : 'User')}</td>
                    <td className='p-2'>{item.show?.movie?.title || 'Movie'}</td>
                    <td className='p-2'>{item.show?.showDateTime ? dateformat(item.show.showDateTime) : 'N/A'}</td>
                    <td className='p-2 font-mono text-xs'>{seats || 'None'}</td>
                    <td className='p-2 font-medium text-primary'>{currency} {item.amount}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  ) : <Loading />
}

export default ListBookings