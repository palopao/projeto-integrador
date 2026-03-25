# 📊 Gráfico de Evolução de Fases - Implementação

## 📝 Resumo da Implementação

Criei um sistema completo para carregar e visualizar a evolução das notas de candidatura por fases (Fase 1, Fase 2, Fase 3) ao longo dos anos (2017-2024).

---

## 🎯 Ficheiros Criados

### 1. **Componente Principal: CoursePhaseEvolutionChart**
- **Localização:** `src/components/CoursePhaseEvolutionChart/`
- **Ficheiros:**
  - `CoursePhaseEvolutionChart.jsx` - Componente React com Recharts
  - `CoursePhaseEvolutionChart.module.css` - Estilos

**Características:**
- Gráfico de linhas mostrando as 3 fases com cores distintas
  - Fase 1: Azul (#2563eb)
  - Fase 2: Verde (#10b981)
  - Fase 3: Laranja (#f59e0b)
- Tooltip interativa ao passar rato
- Estatísticas de média para cada fase
- Estados de carregamento e erro
- Responsivo (adapta-se ao tamanho do contentor)

---

### 2. **Hook React: useCoursePhaseEvolution**
- **Localização:** `src/hooks/useCoursePhaseEvolution.js`

**Funcionalidades:**
- Carrega dados históricos de múltiplos anos
- Agrega dados de um curso específico
- Gerencia loading, error, e data states
- Função refetch para recarregar dados
- Suporta intervalo de anos configurável

**Uso:**
```javascript
const { data, loading, error, yearRange } = useCoursePhaseEvolution(
  codigoInstituicao,  // ex: '300'
  codigoCurso,        // ex: '9813'
  [2017, 2018, ..., 2024],  // anos opcionais
  '/data'  // caminho do dados opcionalmente
)
```

---

### 3. **Expansão do Serviço: examDataService.ts**
- **Localização:** `src/services/examDataService.ts`

**Funções Adicionadas:**
- `aggregateCoursePhaseEvolution()` - Agrega dados de um curso por fases
- `getAvailableYears()` - Obtém intervalo de anos disponíveis
- `PhaseEvolutionData` interface - Tipo para dados de evolução

---

### 4. **Integração no CourseDetail**
- **Localização:** `src/components/CourseDetail/CourseDetail.jsx`

**Modificações:**
- Importação do novo componente e hook
- Renderização do gráfico para Medicina (instituição: "300", curso: "9813")
- Posicionamento no topo da coluna esquerda

---

## 📊 Estrutura dos Dados

### Dados de Entrada (dados_dges_YYYY.json):
```json
{
  "codigo_instituicao": "300",
  "codigo_curso": "9813",
  "curso": "Medicina",
  "fases": {
    "fase_1": { "nota": 189.5 },
    "fase_2": { "nota": 188.3 },
    "fase_3": { "nota": 177.2 }
  }
}
```

### Dados de Saída (PhaseEvolutionData[]):
```javascript
[
  { year: 2017, fase_1: 189.0, fase_2: 187.5, fase_3: 176.0 },
  { year: 2018, fase_1: 189.2, fase_2: 188.0, fase_3: 177.5 },
  // ...
  { year: 2024, fase_1: 189.5, fase_2: 188.3, fase_3: 177.2 }
]
```

---

## 🎨 Visual

O gráfico segue o mesmo padrão visual do Componente de Medicina:
- Eixos com grid ligeiros
- 3 linhas com cores contrastantes
- Pontos interativos em cada data
- Tooltip ao passar o rato
- Legenda automática
- Estatísticas em cards na base

---

## 🔄 Fluxo de Dados

```
CourseDetail Component
    ↓
useCoursePhaseEvolution Hook
    ↓
loadMultipleYearsData() [Service]
    ↓
aggregateCoursePhaseEvolution() [Service]
    ↓
CoursePhaseEvolutionChart [Recharts]
```

---

## 📦 Tipos TypeScript/JSDoc

### PhaseEvolutionData
```javascript
{
  year: number | string,
  fase_1: number | null,
  fase_2: number | null,
  fase_3: number | null
}
```

---

## 🚀 Como Usar em Outros Componentes

```jsx
import CoursePhaseEvolutionChart from '../../components/CoursePhaseEvolutionChart/CoursePhaseEvolutionChart'
import { useCoursePhaseEvolution } from '../../hooks/useCoursePhaseEvolution'

export default function MyComponent() {
  const { data, loading, error, yearRange } = useCoursePhaseEvolution(
    '300',    // código instituição
    '9813'    // código curso
  )

  return (
    <CoursePhaseEvolutionChart
      data={data}
      courseName="Medicina"
      minYear={yearRange.min}
      maxYear={yearRange.max}
      isLoading={loading}
      error={error}
    />
  )
}
```

---

## ✅ Checklist de Implementação

- ✅ Tipos/Interfaces criadas
- ✅ Funções de serviço para agregar dados
- ✅ Hook React para carregamento e gerenciamento
- ✅ Componente de gráfico com Recharts
- ✅ Estilos CSS modulares
- ✅ Tratamento de erros e loading states
- ✅ Integração no CourseDetail
- ✅ Sem erros de compilação

---

## 📍 Localização dos Ficheiros

```
MediaTrix/
├── src/
│   ├── types/
│   │   └── exams.ts                      (tipos existentes)
│   ├── services/
│   │   └── examDataService.ts            (expandido)
│   ├── hooks/
│   │   ├── useExamData.ts                (existente)
│   │   └── useCoursePhaseEvolution.js    (novo)
│   ├── components/
│   │   ├── CourseDetail/
│   │   │   └── CourseDetail.jsx          (integrado)
│   │   └── CoursePhaseEvolutionChart/    (novo)
│   │       ├── CoursePhaseEvolutionChart.jsx
│   │       └── CoursePhaseEvolutionChart.module.css
```

---

## 🔍 Dados Disponíveis

- **Anos:** 2017 até 2024
- **Cursos:** Todos os cursos presentes em `dados_dges_YYYY.json`
- **Fases:** Fase 1, Fase 2, Fase 3
- **Exemplo usado:** Medicina (inst: "300", curso: "9813")

---

## 📌 Notas

- O gráfico carrega automaticamente quando o componente monta
- Suporta null values (fases sem dados)
- A escala do eixo Y é calculada dinamicamente baseada nos dados
- O intervalo de anos é exibido no subtítulo do gráfico
