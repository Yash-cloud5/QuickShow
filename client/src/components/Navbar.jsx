import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import { FaSearch } from 'react-icons/fa'
import { LayoutDashboard, MenuIcon, TicketPlus, XIcon } from 'lucide-react'
import { useClerk, useUser, UserButton } from '@clerk/react'
import { useAppContext } from '../context/AppContext'

const Navbar = () => {

  const [isOpen, setIsOpen] = useState(false)

  const { user } = useUser()
  const { isAdmin } = useAppContext()
  const { openSignIn } = useClerk()
  const navigate = useNavigate()

  const {favoriteMovies} = useAppContext()

  return (

    <div className='absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 md:px-16 lg:px-36 py-4'>

      {/* QuickShow Logo */}

      <Link
        to='/'
        onClick={() => scrollTo(0, 0)}
      >
        <img
          src={assets.logo}
          alt='QuickShow Logo'
          className='w-32 sm:w-40'
        />
      </Link>


      {/* Navigation Menu */}

      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0
    max-md:font-medium max-md:text-lg
    z-50
    flex flex-col md:flex-row
    items-center
    max-md:justify-center
    gap-8
    min-md:px-8
    py-3
    max-md:h-screen
    md:rounded-full
    backdrop-blur
    bg-black/70
    md:bg-white/10
    md:border
    md:border-gray-300/20
    overflow-hidden
    transition-[width]
    duration-300
    ${isOpen ? 'max-md:w-full' : 'max-md:w-0'}
  `}
      >

        {/* Close Menu Icon */}

        <XIcon
          className='md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer'
          onClick={() => setIsOpen(false)}
        />


        {/* Home */}

        <Link
          to='/'
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false)
          }}
        >
          Home
        </Link>


        {/* Movies */}

        <Link
          to='/movies'
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false)
          }}
        >
          Movies
        </Link>


        {/* Theatres */}

        <Link
          to='/'
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false)
          }}
        >
          Theatres
        </Link>


        {/* Releases */}

        <Link
          to='/'
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false)
          }}
        >
          Releases
        </Link>


        {/* Favourites */}

        { favoriteMovies.length>0 &&
          <Link
          to='/favorite'
          onClick={() => {
            scrollTo(0, 0);
            setIsOpen(false)
          }}
        >
          Favourites
        </Link>}

      </div>


      {/* Search + Login/User */}

      <div className='flex items-center gap-8'>

        {/* Search Icon */}

        <FaSearch
          className='max-md:hidden w-6 h-6 cursor-pointer'
        />


        {/* Clerk Login / User Button */}

        {!user ? (

          <button
            onClick={openSignIn}
            className='px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer'
          >
            Login
          </button>

        ) : (

          <UserButton>

            <UserButton.MenuItems>

              {isAdmin && (
                <UserButton.Action
                  label='Admin Dashboard'
                  labelIcon={<LayoutDashboard width={15} />}
                  onClick={() => navigate('/admin')}
                />
              )}

              <UserButton.Action
                label='My Bookings'
                labelIcon={<TicketPlus width={15} />}
                onClick={() => navigate('/my-bookings')}
              />

            </UserButton.MenuItems>

          </UserButton>

        )}

      </div>


      {/* Mobile Menu Icon */}

      <MenuIcon
        className='max-md:ml-4 md:hidden w-8 h-8 cursor-pointer'
        onClick={() => {
          scrollTo(0, 0)
          setIsOpen(true)
        }}
      />

    </div>

  )
}

export default Navbar