import React, { useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import BlurCircle from './BlurCircle'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const Loading = () => {
  const { nextUrl } = useParams()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const navigate = useNavigate()
  const { axios, getToken } = useAppContext()
  const verifiedRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    const verifyAndRedirect = async () => {
      if (sessionId && !verifiedRef.current) {
        verifiedRef.current = true
        try {
          const token = await getToken()
          const { data } = await axios.post(
            '/api/booking/verify-payment',
            { sessionId },
            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
          )
          if (data?.success) {
            toast.success('Payment confirmed! A confirmation email has been sent to your inbox.')
          }
        } catch (error) {
          console.error('Payment verification note:', error?.response?.data?.message || error.message)
        }
      }

      if (nextUrl) {
        const timer = setTimeout(() => {
          if (isMounted) {
            navigate('/' + nextUrl, { replace: true })
          }
        }, sessionId ? 2500 : 3500)
        return () => clearTimeout(timer)
      }
    }

    verifyAndRedirect()

    return () => {
      isMounted = false
    }
  }, [nextUrl, sessionId, navigate, axios, getToken])

  return (
    <div className='relative flex flex-col justify-center items-center min-h-[75vh] px-4'>
      {nextUrl && (
        <>
          <BlurCircle top='-50px' left='-50px' />
          <BlurCircle bottom='50px' right='50px' />
        </>
      )}
      <div className='animate-spin rounded-full h-14 w-14 border-3 border-primary/20 border-t-primary mb-4'></div>
      {nextUrl && (
        <div className='text-center z-10 space-y-1.5'>
          <h2 className='text-lg font-semibold text-white'>Processing Payment</h2>
          <p className='text-xs text-gray-400 max-w-sm'>
            Please wait while we confirm your booking and send the confirmation email to your address...
          </p>
        </div>
      )}
    </div>
  )
}

export default Loading