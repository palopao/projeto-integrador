import { useState, useEffect } from 'react'
import Header from './components/Header/Header'
import Hero from './components/Hero/Hero'
import Stats from './components/Stats/Stats'
import SearchSection from './components/SearchSection/SearchSection'
import CourseDetail from './components/CourseDetail/CourseDetail'
import HowItWorks from './components/HowItWorks/HowItWorks'
import Limitations from './components/Limitations/Limitations'
import Footer from './components/Footer/Footer'
import './App.css'

function App() {
  // Default: Psicologia @ Universidade dos Açores (real course from dados_dges_YYYY.json)
  const defaultCourse = {
    codigoInstituicao: '150',
    codigoCurso: '9219',
    nome: 'Psicologia - Universidade dos Açores - Faculdade de Ciências Sociais e Humanas'
  }

  const [selectedCourse, setSelectedCourse] = useState(defaultCourse)

  // Recuperar curso selecionado do localStorage ao carregar a página
  useEffect(() => {
    const savedCourse = localStorage.getItem('selected_course')
    if (savedCourse) {
      try {
        const parsedCourse = JSON.parse(savedCourse)
        setSelectedCourse(parsedCourse)
      } catch (error) {
        console.error('Erro ao recuperar curso do localStorage:', error)
        setSelectedCourse(defaultCourse)
      }
    }
  }, [])

  const handleCourseSelect = (curso) => {
    setSelectedCourse({
      codigoInstituicao: curso.codigo_instituicao,
      codigoCurso: curso.codigo_curso,
      nome: `${curso.curso} - ${curso.instituicao}`,
      codes: curso.codes // Passar todos os códigos associados
    })
    // Scroll to course detail
    setTimeout(() => {
      document.getElementById('course-detail')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <SearchSection 
          onCourseSelect={handleCourseSelect}
          selectedCourse={selectedCourse}
        />
        <div id="course-detail">
          <CourseDetail 
            codigoInstituicao={selectedCourse.codigoInstituicao}
            codigoCurso={selectedCourse.codigoCurso}
            nomeDefault={selectedCourse.nome}
            codes={selectedCourse.codes}
          />
        </div>
        <HowItWorks />
        <Limitations />
      </main>
      <Footer />
    </>
  )
}

export default App
