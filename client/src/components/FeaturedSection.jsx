import { ArrowBigRight } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import BlurCircle from './BlurCircle'
import MovieCard from './MovieCard'
import { useAppContext } from '../context/AppContext'

const FeaturedSection = () => {

  const navigate = useNavigate()
  const {shows }= useAppContext()

  return (
    <div className='relative px-6 md:px-16 lg:px-36 py-20 overflow-hidden'>

      <BlurCircle top='0' right='-50px' />

      <div className='flex items-center justify-between'>

        <p className='text-2xl font-semibold'>
          Now Showing
        </p>

        <button
          onClick={() => {
            navigate('/movies')
            scrollTo(0, 0)
          }}
          className='group flex items-center gap-2 text-sm text-gray-300 cursor-pointer'
        >
          View All

          <ArrowBigRight
            className='w-4 h-4 group-hover:translate-x-1 transition'
          />
        </button>

      </div>


      <div className='flex flex-wrap max-sm:justify-center gap-8 mt-8 cursor-pointer '>

        {shows.slice(0, 4).map((show) => (
          <MovieCard
            key={show._id}
            movie={show}
          />
        ))}

      </div>


      <div className='flex justify-center mt-20'>

        <button
          onClick={() => {
            navigate('/movies')
            scrollTo(0, 0)
          }}
          className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'
        >
          Show more
        </button>

      </div>

    </div>
  )
}

export default FeaturedSection