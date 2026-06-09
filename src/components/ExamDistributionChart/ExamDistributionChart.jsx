import React, { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { loadExamDistributionData, getUnifiedExamName } from '../../services/examDataService';
import styles from './ExamDistributionChart.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Componente que exibe a distribuição de notas (histograma) para exames num ano específico.
 */
export default function ExamDistributionChart({ year, examNames }) {
  const [selectedYear, setSelectedYear] = useState(year || new Date().getFullYear());
  const [distributionData, setDistributionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sincroniza o ano selecionado se o prop 'year' mudar externamente
  useEffect(() => {
    if (year) setSelectedYear(year);
  }, [year]);

  useEffect(() => {
    if (!selectedYear) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadExamDistributionData(selectedYear);
        setDistributionData(data);
      } catch (err) {
        setError('Não foi possível carregar os dados de distribuição.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedYear]);

  // Cores distintas para os exames (seguindo o padrão do gráfico histórico)
  const examColors = [
    { bg: 'rgba(37, 99, 235, 0.7)', border: 'rgb(37, 99, 235)' },    // Azul
    { bg: 'rgba(16, 185, 129, 0.7)', border: 'rgb(16, 185, 129)' },  // Verde
    { bg: 'rgba(245, 158, 11, 0.7)', border: 'rgb(245, 158, 11)' },   // Laranja
    { bg: 'rgba(239, 68, 68, 0.7)', border: 'rgb(239, 68, 68)' },    // Vermelho
    { bg: 'rgba(139, 92, 246, 0.7)', border: 'rgb(139, 92, 246)' },  // Roxo
  ];

  const chartData = useMemo(() => {
    if (!distributionData || !examNames || examNames.length === 0) return null;

    // Mapeia os exames selecionados (Provas de Ingresso) para os seus nomes unificados
    // e filtra apenas os que possuem dados de distribuição para o ano em questão.
    const datasets = examNames
      .map(name => ({
        original: name,
        unified: getUnifiedExamName(name)
      }))
      .filter(item => distributionData[item.unified])
      .map((item, index) => {
        const colorIndex = index % examColors.length;
        return {
          label: item.original,
          data: distributionData[item.unified],
          backgroundColor: examColors[colorIndex].bg,
          borderColor: examColors[colorIndex].border,
          borderWidth: 1,
          borderRadius: 4,
        };
      });


    if (datasets.length === 0) return null;

    return {
      labels: Array.from({ length: 21 }, (_, i) => i), // Escala de notas de 0 a 20
      datasets,
    };
  }, [distributionData, examNames]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { family: "'Inter', sans-serif", size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        titleColor: '#111827',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 8,
        usePointStyle: true,
        callbacks: {
          title: (items) => `Nota: ${items[0].label}`
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: {
          color: '#f3f4f6',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          font: { size: 11 }
        },
        title: { 
          display: true, 
          text: 'Nº de Alunos',
          color: '#4b5563',
          font: { size: 12, weight: '600' }
        } 
      },
      x: { 
        grid: { display: false },
        ticks: {
          color: '#6b7280',
          font: { size: 11 }
        },
        title: { 
          display: true, 
          text: 'Valores das Notas (0-20)',
          color: '#4b5563',
          font: { size: 12, weight: '600' }
        } 
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.yearSelector}>
          <label htmlFor="year-select">Ano dos dados:</label>
          <select 
            id="year-select" 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className={styles.select}
          >
            {Array.from({ length: (new Date().getFullYear()) - 2017 + 1 }, (_, i) => 2017 + i)
              .sort((a, b) => b - a)
              .map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
          </select>
        </div>
      </div>

      {loading && <div className={styles.loading}>A carregar histograma de {selectedYear}...</div>}
      {error && <div className={styles.error}>{error}</div>}
      {!loading && !error && chartData && (
        <div className={styles.chartWrapper}>
          <Bar data={chartData} options={options} />
        </div>
      )}
      {!loading && !error && !chartData && (
        <div className={styles.noData}>Sem dados de distribuição disponíveis para o ano {selectedYear}.</div>
      )}
    </div>
  );
}