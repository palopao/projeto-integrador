import type {
  CourseDetails,
  CourseYearData,
  ExamPosition,
  ExamOption,
  ExamAlternatives,
} from '../types/exams';
import { normalize } from '../utils/normalize';

/**
 * Serviço para processar e carregar dados de exames
 */

/**
 * Verifica se uma string é uma opção de prova (formato: "XX  Nome da Prova")
 */
function isExamOption(str: string): boolean {
  return /^\d{2}\s{2}/.test(str.trim());
}

/**
 * Converte uma string de prova em um objeto ExamOption
 * Formato esperado: "18  Português" -> { code: "18", name: "Português" }
 */
function parseExamOption(examStr: string): ExamOption {
  const parts = examStr.trim().split(/\s{2,}/);
  return {
    code: parts[0],
    name: parts[1] || '',
  };
}

/**
 * Processa o array de provas de ingresso, agrupando opções separadas por "ou"
 * Exemplo:
 *   ["18  Português", "ou", "17  Mat. Apl", "18  Português"]
 *   ->
 *   [
 *     { options: [{ code: "18", name: "Português" }, { code: "17", name: "Mat. Apl" }] },
 *     { code: "18", name: "Português" }
 *   ]
 */
export function parseProvasIngresso(provas: string[]): ExamPosition[] {
  if (!provas || provas.length === 0) {
    return [];
  }

  const result: ExamPosition[] = [];
  let currentGroup: ExamOption[] = [];

  for (const prova of provas) {
    if (prova === 'ou') {
      // Marcador de alternativa, continua acumulando no grupo
      continue;
    }

    if (isExamOption(prova)) {
      const option = parseExamOption(prova);
      currentGroup.push(option);

      // Verifica se o próximo item é 'ou'
      const idx = provas.indexOf(prova);
      const nextItem = provas[idx + 1];

      if (nextItem !== 'ou') {
        // Fim do grupo de alternativas
        if (currentGroup.length > 1) {
          result.push({
            options: currentGroup,
          } as ExamAlternatives);
        } else if (currentGroup.length === 1) {
          result.push(currentGroup[0]);
        }
        currentGroup = [];
      }
    }
  }

  // Adiciona qualquer grupo restante
  if (currentGroup.length > 0) {
    if (currentGroup.length > 1) {
      result.push({
        options: currentGroup,
      } as ExamAlternatives);
    } else {
      result.push(currentGroup[0]);
    }
  }

  return result;
}

/**
 * Carrega os detalhes dos cursos do ficheiro JSON
 */
export async function loadCourseDetails(
  path: string = '/data/cursos_detalhes.json'
): Promise<CourseDetails[]> {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Erro ao carregar detalhes dos cursos: ${response.status}`);
    }
    const data = await response.json();

    // Processa as provas de ingresso
    return data.map((course: any) => ({
      ...course,
      provas_ingresso: parseProvasIngresso(course.provas_ingresso || []),
    }));
  } catch (error) {
    console.error('Erro ao carregar dados de cursos:', error);
    throw error;
  }
}

/**
 * Carrega os dados de candidatura de um ano específico
 */
export async function loadCourseYearData(
  year: number,
  path: string = '/data'
): Promise<CourseYearData[]> {
  try {
    const filename = `dados_dges_${year}.json`;
    const response = await fetch(`${path}/${filename}`);

    if (!response.ok) {
      throw new Error(
        `Erro ao carregar dados de ${year}: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`Erro ao carregar dados do ano ${year}:`, error);
    throw error;
  }
}

/**
 * Carrega dados de múltiplos anos
 */
export async function loadMultipleYearsData(
  years: number[],
  path: string = '/data'
): Promise<Map<number, CourseYearData[]>> {
  const dataByYear = new Map<number, CourseYearData[]>();

  const promises = years.map(async (year) => {
    try {
      const data = await loadCourseYearData(year, path);
      dataByYear.set(year, data);
    } catch (error) {
      console.warn(`Falha ao carregar dados de ${year}:`, error);
    }
  });

  await Promise.all(promises);
  return dataByYear;
}

/**
 * Encontra um curso pelos códigos de instituição e curso
 */
export function findCourse(
  courses: CourseDetails[],
  codigoInstituicao: string,
  codigoCurso: string
): CourseDetails | undefined {
  return courses.find(
    (c) =>
      c.codigo_instituicao === codigoInstituicao &&
      c.codigo_curso === codigoCurso
  );
}

/**
 * Filtra cursos por instituição
 */
export function filterCoursesByInstitution(
  courses: CourseDetails[],
  instituicao: string
): CourseDetails[] {
  return courses.filter((c) => c.curso.includes(instituicao));
}

/**
 * Verifica se uma posição de prova é um grupo de alternativas
 */
export function isAlternatives(position: ExamPosition): position is ExamAlternatives {
  return 'options' in position;
}

/**
 * Dados agregados de evolução de fases para um curso
 */
export interface PhaseEvolutionData {
  year: number | string;
  fase_1: number | null;
  fase_2: number | null;
  fase_3: number | null;
}

/**
 * Agrega dados de evolução de notas de um curso específico ao longo dos anos
 * Retorna um array ordenado de anos com as notas de cada fase
 */
export function aggregateCoursePhaseEvolution(
  codigoInstituicao: string,
  codigoCurso: string, // Changed parameter name and type for precise matching
  dataByYear: Map<number, CourseYearData[]>,
  displayCourseName?: string // Optional, for fallback or logging
): PhaseEvolutionData[] {
  const years = Array.from(dataByYear.keys()).sort((a, b) => a - b)

  return years.map((year) => {
    const courses = dataByYear.get(year) || []

    // Prioritize matching by codigoInstituicao and codigoCurso
    let courseData = courses.find((c) =>
      c.codigo_instituicao === codigoInstituicao && c.codigo_curso === codigoCurso
    )

    // Fallback to matching by displayCourseName if provided and primary match fails
    if (!courseData && displayCourseName) {
      const normalizedDisplayCourseName = normalize(displayCourseName)
      courseData = courses.find((c) =>
        c.codigo_instituicao === codigoInstituicao && normalize(c.curso).includes(normalizedDisplayCourseName)
      )
    }

    return {
      year,
      fase_1: courseData?.fases?.fase_1?.nota ?? null,
      fase_2: courseData?.fases?.fase_2?.nota ?? null,
      fase_3: courseData?.fases?.fase_3?.nota ?? null,
    }
  })
}

/**
 * Obtém o intervalo de anos disponíveis nos dados
 */
export function getAvailableYears(dataByYear: Map<number, CourseYearData[]>): {
  min: number;
  max: number;
} {
  const years = Array.from(dataByYear.keys());
  return {
    min: Math.min(...years),
    max: Math.max(...years),
  };
}

/**
 * Resultado da previsão com intervalo de confiança
 */
export interface PredictionResult {
  year: number;
  predicted: number;
  ciLow: number;
  ciHigh: number;
}

/**
 * Resultado de regressão linear simples
 */
interface LinearRegressionResult {
  slope: number;
  intercept: number;
  r2: number;
  stdError: number;
}

/**
 * Calcula regressão linear simples
 * @param x Array de valores de X (anos)
 * @param y Array de valores de Y (notas)
 * @returns slope, intercept, r2 (coeficiente de determinação), e erro padrão
 */
function linearRegression(x: number[], y: number[]): LinearRegressionResult {
  if (x.length < 2 || y.length < 2 || x.length !== y.length) {
    throw new Error('Arrays X e Y devem ter pelo menos 2 elementos e tamanho igual');
  }

  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  // Calcula slope (m)
  const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
  const denominator = x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0);
  const slope = numerator / denominator;

  // Calcula intercept (b)
  const intercept = meanY - slope * meanX;

  // Calcula R² (coeficiente de determinação)
  const ssTotal = y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0);
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * x[i] + intercept;
    return sum + (yi - predicted) ** 2;
  }, 0);
  const r2 = 1 - (ssResidual / ssTotal);

  // Calcula erro padrão
  const mse = ssResidual / (n - 2);
  const stdError = Math.sqrt(mse);

  return { slope, intercept, r2, stdError };
}

/**
 * Obtém o valor crítico t para intervalo de confiança de 95% aproximado
 * Usa uma tabela simplificada (para tamanhos de amostra típicos)
 */
function getTCriticalValue(n: number): number {
  // Graus de liberdade = n - 2
  const df = Math.max(1, n - 2);

  // Tabela de valores t críticos para IC de 95% (bicaudal)
  const tValues: { [key: number]: number } = {
    1: 12.706,
    2: 4.303,
    3: 3.182,
    4: 2.776,
    5: 2.571,
    6: 2.447,
    7: 2.365,
    8: 2.306,
    9: 2.262,
    10: 2.228,
    15: 2.131,
    20: 2.086,
    25: 2.06,
    30: 2.042,
    40: 2.021,
    50: 2.009,
    100: 1.984,
    200: 1.972,
    1000: 1.962,
  };

  // Encontra o valor mais próximo
  const keys = Object.keys(tValues).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < keys.length - 1; i++) {
    if (df >= keys[i] && df < keys[i + 1]) {
      // Interpolação linear simples
      const w1 = (keys[i + 1] - df) / (keys[i + 1] - keys[i]);
      return w1 * tValues[keys[i]] + (1 - w1) * tValues[keys[i + 1]];
    }
  }

  // Se df > 1000, retorna o valor para df grande
  return tValues[1000] || 1.96;
}

/**
 * Prediz a nota para o próximo ano usando regressão linear
 * @param data Array com dados históricos (com ano e valores de nota)
 * @param phase Chave da fase ('fase_1', 'fase_2', 'fase_3')
 * @param nextYear Ano para o qual fazer a previsão (default: ano máximo + 1)
 * @returns Previsão com intervalo de confiança de 95%
 */
export function predictNextYearPhase(
  data: PhaseEvolutionData[],
  phase: 'fase_1' | 'fase_2' | 'fase_3',
  nextYear?: number
): PredictionResult | null {
  // Filtra dados válidos (sem null)
  const validData = data.filter((d) => d[phase] !== null);

  if (validData.length < 2) {
    return null; // Precisa de pelo menos 2 pontos para fazer regressão
  }

  // Extrai anos e valores
  const years = validData.map((d) => Number(d.year));
  const values = validData.map((d) => d[phase] as number);

  // Calcula regressão linear
  const { slope, intercept, stdError } = linearRegression(years, values);

  // Define ano de previsão
  const predictionYear = nextYear || Math.max(...years) + 1;

  // Calcula valor previsto
  const predicted = slope * predictionYear + intercept;

  // Calcula intervalo de confiança
  const n = validData.length;
  const tCritical = getTCriticalValue(n);
  const meanX = years.reduce((a, b) => a + b) / n;
  const sumSquaredDev = years.reduce((sum, x) => sum + (x - meanX) ** 2, 0);

  // Erro padrão da previsão
  const sePredict = stdError * Math.sqrt(1 + 1 / n + ((predictionYear - meanX) ** 2) / sumSquaredDev);
  const margin = tCritical * sePredict;

  return {
    year: predictionYear,
    predicted: Math.max(0, Math.round(predicted * 10) / 10), // Arredonda para 1 decimal
    ciLow: Math.max(0, Math.round((predicted - margin) * 10) / 10),
    ciHigh: Math.round((predicted + margin) * 10) / 10,
  };
}

/**
 * Prediz os próximos anos para as 3 fases
 */
export function predictPhaseEvolution(
  data: PhaseEvolutionData[],
  yearsAhead: number = 3
): {
  fase_1: PredictionResult[];
  fase_2: PredictionResult[];
  fase_3: PredictionResult[];
} {
  const maxYear = Math.max(...data.map((d) => Number(d.year)));
  const predictions = {
    fase_1: [] as PredictionResult[],
    fase_2: [] as PredictionResult[],
    fase_3: [] as PredictionResult[],
  };

  for (let i = 1; i <= yearsAhead; i++) {
    const year = maxYear + i;

    const pred1 = predictNextYearPhase(data, 'fase_1', year);
    if (pred1) predictions.fase_1.push(pred1);

    const pred2 = predictNextYearPhase(data, 'fase_2', year);
    if (pred2) predictions.fase_2.push(pred2);

    const pred3 = predictNextYearPhase(data, 'fase_3', year);
    if (pred3) predictions.fase_3.push(pred3);
  }

  return predictions;
}

/**
 * Carrega dados históricos de exames (medias por ano)
 */
export async function loadExamHistoryData(
  examNames: string[],
  years = [2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024],
  dataPath = '/data'
) {
  const result: {
    [examName: string]: { year: number; media_0_20: number; media_0_200: number }[];
  } = {};

  try {
    // Para cada ano, carrega medias_historicas_exames.json
    const examsByYear: {
      Ano: number;
      Exame_Unificado: string;
      Fase: number;
      Total_Alunos: number;
      Media_0_200: number;
      Media_0_20: number;
    }[] = [];

    for (const year of years) {
      try {
        const response = await fetch(`${dataPath}/medias_historicas_exames.json`);
        const data = await response.json();
        // Nota: este arquivo contém dados de TODOS os anos
        examsByYear.push(...data);
      } catch (err) {
        console.warn(`Erro ao carregar medias_historicas_exames.json para ${year}:`, err);
      }
    }

    // Agrupa por nome de exame e filtra pelos selecionados
    for (const examName of examNames) {
      result[examName] = [];
      const filtered = examsByYear
        .filter((e) => e.Exame_Unificado === examName && e.Fase === 1) // Apenas Fase 1
        .sort((a, b) => a.Ano - b.Ano);

      for (const entry of filtered) {
        result[examName].push({
          year: entry.Ano,
          media_0_20: entry.Media_0_20,
          media_0_200: entry.Media_0_200,
        });
      }
    }

    return result;
  } catch (error) {
    console.error('Erro ao carregar histórico de exames:', error);
    throw error;
  }
}
