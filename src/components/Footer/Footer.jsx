import { useState } from 'react'
import LogoIcon from '../../assets/icons/logo.svg?react'
import GithubIcon from '../../assets/icons/github.svg?react'
import styles from './Footer.module.css'

const footerColumns = [
  {
    links: [
      { id: 'fontes', label: 'Fontes Oficiais', icon: '🌐' },
      { id: 'limitacoes', label: 'Limitações', icon: '⚠️' },
      { id: 'atualizacoes', label: 'Atualizações', icon: '🆕' },
    ],
  },
  {
    links: [
      { id: 'contacto', label: 'Contactar equipa', icon: '📧' },
      { id: 'creditos', label: 'Créditos', icon: '📜' },
      { id: 'github', label: 'GitHub', icon: GithubIcon({ style: { width: '20px', height: '20px' } }) },
    ],
  },
]

const modalData = {
  fontes: {
    title: 'Fontes Oficiais',
    content: (
      <div>
        <p>Os dados utilizados nesta plataforma provêm das seguintes entidades oficiais:</p>
        <ul style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li><a href="https://www.dges.gov.pt" target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>DGES - Direção-Geral do Ensino Superior</a></li>
          <li><a href="https://www.dge.mec.pt/relatoriosestatisticas-0" target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>DGE - Estatísticas de Exames</a></li>
        </ul>
      </div>
    ),
  },
  limitacoes: {
  title: 'Limitações',
  content: (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      
      <div>
        <strong>Natureza dos dados:</strong>
        <br />
        Baseado em previsões estatísticas
      </div>

      <div>
        <strong>Precisão:</strong>
        <br />
        Os valores apresentados não correspondem a colocações reais
      </div>

      <div>
        <strong>Objetivo:</strong>
        <br />
        Fornecer uma estimativa de referência para apoio à decisão
      </div>

    </div>
  ),
},
atualizacoes: {
  title: 'Atualizações',
  content: (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      
      <div>
        <strong>Versão atual:</strong>
        <br />
        1.0.0
      </div>

      <div>
        <strong>Estado:</strong>
        <br />
        Versão inicial de lançamento
      </div>

      <div>
        <strong>Histórico:</strong>
        <br />
        Ainda não existem atualizações ou correções
      </div>

    </div>
  ),
},
  contacto: {
  title: 'Contactar a Equipa',
  content: (
    <div style={{ display: 'grid', gap: '0.8rem' }}>
      
      <div>
        <strong>José Torres:</strong><br/>
        <small>
          <a href="mailto:up202307047@up.pt">up202307047@up.pt</a> |{' '}
          <a href="mailto:up202307047@g.uporto.pt">up202307047@g.uporto.pt</a>
        </small>
      </div>

      <div>
        <strong>Tiago Yin:</strong><br/>
        <small>
          <a href="mailto:up202306438@up.pt">up202306438@up.pt</a> |{' '}
          <a href="mailto:up202306438@g.uporto.pt">up202306438@g.uporto.pt</a>
        </small>
      </div>

      <div>
        <strong>José Reis:</strong><br/>
        <small>
          <a href="mailto:up202307304@up.pt">up202307304@up.pt</a> |{' '}
          <a href="mailto:up202307304@g.uporto.pt">up202307304@g.uporto.pt</a>
        </small>
      </div>

      <div>
        <strong>Vicente Silva:</strong><br/>
        <small>
          <a href="mailto:up202303702@up.pt">up202303702@up.pt</a> |{' '}
          <a href="mailto:up202303702@g.uporto.pt">up202303702@g.uporto.pt</a>
        </small>
      </div>

    </div>
  ),
},
  creditos: {
    title: 'Créditos',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
      
        <div>
          <strong>Projeto:</strong>
          <br />
          MediaTrix
        </div>

        <div>
          <strong>Unidade Curricular:</strong>
          <br />
          Projeto Integrador
        </div>

        <div>
          <strong>Curso:</strong>
          <br />
          LEIC — Licenciatura em Engenharia Informática e Computação
        </div>

        <div>
          <strong>Instituição:</strong>
          <br />
          Faculdade de Engenharia da Universidade do Porto (FEUP)
        </div>

        <div>
          <strong>Docente Responsável:</strong>
          <br />
          Professor Carlos Baquero-Moreno
          <br />
          <small>
            <a href="mailto:cbm@fe.up.pt">cbm@fe.up.pt</a>
          </small>
        </div>

      </div>
    ),
  },
  github: {
    title: 'GitHub',
    content: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        <a href="https://github.com/palopao/projeto-integrador" target="_blank" rel="noreferrer" style={{ fontWeight: 'bold', color: '#007bff' }}>Repositório do Projeto</a>
        <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '0.5rem 0' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <a href="https://github.com/palopao" target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>José Torres</a>
          <a href="https://github.com/TiagoZouYin" target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>Tiago Yin</a>
          <a href="https://github.com/zepilim" target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>José Reis</a>
          <a href="https://github.com/up202303702" target="_blank" rel="noreferrer" style={{ color: '#007bff' }}>Vicente Silva</a>
        </div>
      </div>
    ),
  },
}

export default function Footer() {
  const [activeModal, setActiveModal] = useState(null)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openModal = (e, id) => {
    e.preventDefault()
    setActiveModal(id)
    document.body.style.overflow = 'hidden' // Prevenir scroll ao fundo
  }

  const closeModal = () => {
    setActiveModal(null)
    document.body.style.overflow = 'unset'
  }

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <LogoIcon className={styles.logoIcon} />
            <span className={styles.logoText}>MediaTrix</span>
          </div>
          <p className={styles.tagline}>
            Prever Médias
            <br />
            Planear o Futuro
          </p>
        </div>
        {footerColumns.map((col, i) => (
          <nav key={i} className={styles.col}>
            {col.links.map((link, j) => (
              <a 
                key={j} 
                href="#" 
                className={styles.link} 
                onClick={(e) => openModal(e, link.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ fontSize: '1.2rem' }}>{link.icon}</span>
                {link.label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <div className={styles.bottom}>
        <button className={styles.backToTop} onClick={scrollToTop}>
          Voltar ao topo
        </button>
      </div>

      {/* Simple Modal Overlay */}
      {activeModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              position: 'relative',
              color: '#333',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '10px', right: '15px',
                border: 'none', background: 'none',
                fontSize: '1.5rem', cursor: 'pointer',
                color: '#999'
              }}
            >
              &times;
            </button>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#1a1a1a' }}>{modalData[activeModal].title}</h3>
            <div style={{ lineHeight: '1.6' }}>
              {modalData[activeModal].content}
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}
