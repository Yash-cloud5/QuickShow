import React, { useEffect } from 'react'
import AdminNavbar from '../../components/admin/AdminNavbar'
import AdminSlidebar from '../../components/admin/AdminSlidebar'
import { Navigate, Outlet } from 'react-router-dom'
import { SignIn, useUser } from '@clerk/react'
import Loading from '../../components/Loading'
import toast from 'react-hot-toast'
import { useAppContext } from '../../context/AppContext'

const Layout = () => {
  const { user, isLoaded } = useUser()
  const { isAdmin, isAdminLoading } = useAppContext()
  const hasAlerted = React.useRef(false)

  useEffect(() => {
    if (isLoaded && user && !isAdminLoading && !isAdmin) {
      if (!hasAlerted.current) {
        hasAlerted.current = true
        toast.error('You are not authorised to access admin dashboard')
      }
    } else if (isAdmin) {
      hasAlerted.current = false
    }
  }, [isLoaded, user, isAdminLoading, isAdmin])

  if (!isLoaded || (user && isAdminLoading)) {
    return <Loading />
  }

  if (!user) {
    return (
      <div className='min-h-screen flex justify-center items-center'>
        <SignIn fallbackRedirectUrl={'/admin'} />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to='/' replace />
  }

  return (
    <>
      <AdminNavbar />
      <div className='flex'>
        <AdminSlidebar />
        <div className='flex-1 px-4 py-10 md:px-10 h-[calc(100vh-64px)] overflow-y-auto'>
          <Outlet />
        </div>
      </div>
    </>
  )
}

export default Layout
