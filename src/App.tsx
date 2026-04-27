import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import { useAppStore } from '@/lib/store/useAppStore'
import { loadDataset } from '@/lib/data/loader'
import Shell from '@/components/layout/Shell'

// Code-split routes — recharts (used by Company) is the largest dep.
const Calendar = lazy(() => import('@/routes/Calendar'))
const Movers = lazy(() => import('@/routes/Movers'))
const Alerts = lazy(() => import('@/routes/Alerts'))
const Company = lazy(() => import('@/routes/Company'))

function RouteFallback() {
  return (
    <div className="mx-auto max-w-7xl py-10">
      <div className="skeleton h-9 w-44 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-44 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const setDataset = useAppStore((s) => s.setDataset)
  const setLoading = useAppStore((s) => s.setLoading)
  const setError = useAppStore((s) => s.setError)
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    loadDataset()
      .then((ds) => {
        if (!cancelled) setDataset(ds)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [setDataset, setLoading, setError])

  return (
    <Shell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Calendar />} />
          <Route path="/movers" element={<Movers />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/c/:ticker" element={<Company />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Shell>
  )
}
