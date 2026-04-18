import { useState, useEffect } from 'react'

export function useExamHistoricalData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/data/medias_historicas_exames.json')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const jsonData = await response.json()
        setData(jsonData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err : (new Error('Unknown error') as any))
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return { data, loading, error }
}
