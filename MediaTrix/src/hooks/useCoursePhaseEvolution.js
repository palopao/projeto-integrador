import { useState, useEffect } from 'react'
import { loadMultipleYearsData, aggregateCoursePhaseEvolution, predictPhaseEvolution } from '../services/examDataService'

/**
 * Hook para carregar e agregar dados de evolução de fases de um curso
 * Inclui previsões para os próximos anos
 */
export function useCoursePhaseEvolution(
  codigoInstituicao,
  codigoCurso,
  years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  dataPath = '/data'
) {
  const [data, setData] = useState(null)
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [yearRange, setYearRange] = useState({ min: null, max: null })

  useEffect(() => {
    if (!codigoInstituicao || !codigoCurso) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let mounted = true

    const loadDataAsync = async () => {
      try {
        const validYears = years.filter((y) => y >= 2017 && y <= 2024)

        if (validYears.length === 0) {
          throw new Error('Nenhum ano válido fornecido')
        }

        const dataByYear = await loadMultipleYearsData(validYears, dataPath)

        if (dataByYear.size === 0) {
          throw new Error('Nenhum dado disponível para os anos solicitados')
        }

        const evolutionData = aggregateCoursePhaseEvolution(
          codigoInstituicao,
          codigoCurso,
          dataByYear
        )

        const yearArrays = Array.from(dataByYear.keys()).sort((a, b) => a - b)

        if (mounted) {
          setYearRange({
            min: yearArrays.length > 0 ? yearArrays[0] : null,
            max: yearArrays.length > 0 ? yearArrays[yearArrays.length - 1] : null,
          })

          setData(evolutionData)

          // Calcula previsões para os próximos 3 anos
          try {
            const predictionData = predictPhaseEvolution(evolutionData, 3)
            setPredictions(predictionData)
          } catch (predErr) {
            console.warn('Erro ao calcular previsões:', predErr)
            setPredictions(null)
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados de evolução:', err)
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Erro desconhecido'))
          setData(null)
          setPredictions(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDataAsync()

    return () => {
      mounted = false
    }
  }, [codigoInstituicao, codigoCurso, years, dataPath])

  const refetch = () => {
    if (codigoInstituicao && codigoCurso) {
      setLoading(true)
      setError(null)

      const validYears = years.filter((y) => y >= 2017 && y <= 2024)

      loadMultipleYearsData(validYears, dataPath)
        .then((dataByYear) => {
          if (dataByYear.size === 0) {
            throw new Error('Nenhum dado disponível para os anos solicitados')
          }

          const evolutionData = aggregateCoursePhaseEvolution(
            codigoInstituicao,
            codigoCurso,
            dataByYear
          )

          const yearArrays = Array.from(dataByYear.keys()).sort((a, b) => a - b)
          setYearRange({
            min: yearArrays.length > 0 ? yearArrays[0] : null,
            max: yearArrays.length > 0 ? yearArrays[yearArrays.length - 1] : null,
          })

          setData(evolutionData)

          try {
            const predictionData = predictPhaseEvolution(evolutionData, 3)
            setPredictions(predictionData)
          } catch (predErr) {
            console.warn('Erro ao calcular previsões:', predErr)
            setPredictions(null)
          }

          setError(null)
        })
        .catch((err) => {
          console.error('Erro ao recarregar dados de evolução:', err)
          setError(err instanceof Error ? err : new Error('Erro desconhecido'))
          setData(null)
          setPredictions(null)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }

  return {
    data,
    predictions,
    loading,
    error,
    yearRange,
    refetch,
  }
}
