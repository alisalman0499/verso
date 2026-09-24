import { useEffect, useState } from 'react'

// The current time, held in state and re-read every 30 seconds, so a page
// re-renders on its own as time passes (the now-line moves, and at midnight
// Today becomes the new day). Reading `new Date()` during render instead
// looks equivalent but freezes until something else causes a render.
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}
