import { AuthProvider } from '../contexts/AuthContext'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Navbar from '../components/Navbar'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

function saveScrollPos(url: string) {
  const scrollPos = { x: window.scrollX, y: window.scrollY }
  sessionStorage.setItem(url, JSON.stringify(scrollPos))
}

function restoreScrollPos(url: string) {
  const scrollPos = JSON.parse(sessionStorage.getItem(url) || '{"x":0,"y":0}')
  window.scrollTo(scrollPos.x, scrollPos.y)
}

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    if (!router.isReady) return

    // Save scroll position for the current page before leaving
    router.events.on('routeChangeStart', (url) => {
      if (router.asPath !== url) {
        saveScrollPos(router.asPath)
      }
    })

    // Restore scroll position when navigating back
    router.events.on('routeChangeComplete', (url) => {
      if (router.asPath === url && sessionStorage.getItem(url)) {
        restoreScrollPos(url)
      }
    })

    return () => {
      router.events.off('routeChangeStart', saveScrollPos)
      router.events.off('routeChangeComplete', restoreScrollPos)
    }
  }, [router.isReady])

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-16">
          <Component {...pageProps} />
        </div>
      </div>
    </AuthProvider>
  )
}

export default MyApp 