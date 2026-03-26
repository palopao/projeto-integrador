import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CourseDetails, CourseYearData } from '../types/exams';
import {
  loadCourseDetails,
  loadCourseYearData,
  loadMultipleYearsData,
} from '../services/examDataService';

interface UseExamDataState {
  courseDetails: CourseDetails[] | null;
  courseYearData: Map<number, CourseYearData[]> | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Internal helper to handle async state transitions consistently
 */
function useAsyncHandler<T>(
  asyncFn: () => Promise<T>,
  dependencies: any[]
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch: execute
  };
}

/**
 * Hook para carregar e gerenciar dados de exames
 * @param years - Anos para os quais carregar dados (exemplo: [2020, 2021, 2022, 2023, 2024])
 * @param dataPath - Caminho base para os ficheiros de dados
 */
export function useExamData(
  years: number[] = [2024],
  dataPath: string = '/data'
) {
  const { data, loading, error, refetch } = useAsyncHandler(
    () => Promise.all([
      loadCourseDetails(dataPath + '/cursos_detalhes.json'),
      loadMultipleYearsData(years, dataPath),
    ]),
    [years, dataPath]
  );

  // Split the results back into the expected state format
  const courseDetails = useMemo(() => data?.[0] ?? null, [data]);
  const courseYearData = useMemo(() => (data?.[1] as Map<number, CourseYearData[]>) ?? null, [data]);

  return {
    courseDetails,
    courseYearData,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook para carregar dados de um ano específico
 */
export function useExamDataByYear(year: number, dataPath: string = '/data') {
  return useAsyncHandler(
    () => loadCourseYearData(year, dataPath),
    [year, dataPath]
  );
}

/**
 * Hook para carregar apenas os detalhes dos cursos
 */
export function useCourseDetails(dataPath: string = '/data') {
  const { data, loading, error, refetch } = useAsyncHandler(
    () => loadCourseDetails(dataPath + '/cursos_detalhes.json'),
    [dataPath]
  );
  return { courseDetails: data, loading, error, refetch };
}
