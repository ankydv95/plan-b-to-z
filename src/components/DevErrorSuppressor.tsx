'use client'

import { useEffect } from 'react'

export default function DevErrorSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const handler = (event: ErrorEvent) => {
      if (event.error === undefined || event.error === null) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      if (event.reason === undefined || event.reason === null) {
        event.preventDefault()
        event.stopImmediatePropagation()
      }
    }
    window.addEventListener('error', handler, true)
    window.addEventListener('unhandledrejection', rejectionHandler, true)
    return () => {
      window.removeEventListener('error', handler, true)
      window.removeEventListener('unhandledrejection', rejectionHandler, true)
    }
  }, [])
  return null
}
