'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Client landing redirects to home for intake start
export default function ClientPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/')
  }, [router])
  return null
}
