import { useEffect, useRef } from 'react'

export function useInterval(cb, ms) {
  const saved = useRef(cb)
  useEffect(() => {
    saved.current = cb
  }, [cb])
  useEffect(() => {
    if (ms == null) return
    const id = setInterval(() => saved.current(), ms)
    return () => clearInterval(id)
  }, [ms])
}
