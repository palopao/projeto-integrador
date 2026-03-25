import { useState, useEffect, useCallback } from 'react'
import { loadExamHistoryData } from '../services/examDataService'

/**
 * Hook para carregar dados históricos de exames (2017-2024)
 * Retorna os dados de evolução de notas para exames específicos
 */
export function useExamEvolution(
  examNames = ['Biologia', 'Fisica'],
  years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  dataPath = '/data'
) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const examHistory = await loadExamHistoryData(examNames, years, dataPath)
      
      if (!examHistory || Object.keys(examHistory).length === 0) {
        throw new Error('Nenhum dado de exames disponível')
      }

      // Transforma em formato adequado para gráficos
      // Resultado: Array[{ year, examName1, examName2, ...}]
      const allYears = new Set()
      for (const examData of Object.values(examHistory)) {
        examData.forEach((d) => allYears.add(d.year))
      }

      const sortedYears = Array.from(allYears).sort((a, b) => a - b)

      const chartData = sortedYears.map((year) => {
        const row = { year }
        for (const [examName, data] of Object.entries(examHistory)) {
          const entry = data.find((d) => d.year === year)
          row[examName] = entry ? entry.media_0_20 : null // Usar escala 0-20
        }
        return row
      })

      setData(chartData)
    } catch (err) {
      console.error('Erro ao carregar evolução de exames:', err)
      setError(err instanceof Error ? err : new Error('Erro desconhecido'))
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [examNames.join(','), years.join(','), dataPath])

  useEffect(() => {
    if (examNames && examNames.length > 0) {
      loadData()
    }
  }, [loadData])

  const refetch = useCallback(() => {
    loadData()
  }, [loadData])

  return { data, loading, error, refetch }
}
