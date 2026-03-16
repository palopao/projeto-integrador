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
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Stats />
        <SearchSection />
        <CourseDetail />
        <HowItWorks />
        <Limitations />
      </main>
      <Footer />
    </>
  )
}

export default App
