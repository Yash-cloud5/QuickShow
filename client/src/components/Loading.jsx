import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import BlurCircle from './BlurCircle'

const Loading = () => {
  const { nextUrl } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    if (nextUrl) {
      const timer = setTimeout(() => {
        navigate('/' + nextUrl)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [nextUrl, navigate])

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
            Please wait while we confirm your booking and redirect you to your tickets...
          </p>
        </div>
      )}
    </div>
  )
}

export default Loading