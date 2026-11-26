import { useCallback, useEffect, useRef, useState } from 'react'

// Small data-loading hook giving every page consistent loading / error / retry states.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null })
  const alive = useRef(true)
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    return fn()
      .then((data) => alive.current && setState({ loading: false, error: null, data }))
      .catch((error) => alive.current && setState({ loading: false, error, data: null }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => {
    alive.current = true
    run()
    return () => {
      alive.current = false
    }
  }, [run])
  return { ...state, retry: run }
}
