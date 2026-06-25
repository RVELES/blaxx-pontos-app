// Viagens — BlaXx Travel (showcase): rede de hotéis/voos que aceitam pontos.
// Parceiros reais são linkados via /parceiros. Busca e reservas são showcase.
import { useNavigate } from 'react-router-dom'
import { Topbar } from '../components/Shell'

const DEMO = { fontSize: 10, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase' as const, color: '#7a9e00', background: 'rgba(89,253,39,.14)', border: '1px solid rgba(89,253,39,.4)', padding: '3px 8px', borderRadius: 999 }

const HOTELS = [
  { k: 'M', name: 'Marriott Bonvoy', rt: '8.500+ hotéis · 139 países' },
  { k: 'H', name: 'Hilton Honors', rt: '7.000+ hotéis · 122 países' },
  { k: 'A', name: 'Accor ALL', rt: '5.500+ hotéis · 110 países' },
  { k: 'I', name: 'IHG One Rewards', rt: '6.000+ hotéis · 100 países' },
  { k: 'Y', name: 'World of Hyatt', rt: '1.300+ hotéis · 75 países' },
]
const AIRLINES = [
  { k: '✈', name: 'Smiles', rt: 'Voos nacionais e internacionais' },
  { k: '✈', name: 'LATAM Pass', rt: 'América + Europa + Oceania' },
  { k: '✈', name: 'Azul Fidelidade', rt: 'Brasil + EUA + Portugal' },
]

export default function Viagens() {
  const navigate = useNavigate()
  return (
    <>
      <Topbar eyebrow="Mundo Blaxx" title="BlaXx Travel" />

      <div className="card" style={{ position: 'relative', background: 'linear-gradient(140deg,#06080A,#0D1217)', color: '#fff', border: 0 }}>
        <span style={{ ...DEMO, position: 'absolute', top: 16, right: 16 }}>demo</span>
        <div className="label" style={{ color: 'rgba(255,255,255,.6)' }}>Para onde seus pontos te levam</div>
        <h2 style={{ fontSize: 34, margin: '10px 0 6px' }}>Voe e hospede-se com pontos.</h2>
        <p style={{ color: 'rgba(255,255,255,.7)', maxWidth: 520 }}>Use seus pontos Blaxx em voos e diárias nas maiores redes do mundo — em 40+ destinos.</p>
        <div className="row mt-6" style={{ gap: 10, flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={() => navigate('/parceiros')}>Ver parceiros →</button>
          <button className="btn ghost" style={{ borderColor: 'rgba(255,255,255,.2)', color: '#fff' }} onClick={() => navigate('/comprar-pontos')}>Comprar pontos</button>
        </div>
      </div>

      <div className="grid cols-2 mt-8">
        <div className="card">
          <div className="section-head"><h3>Hotéis que aceitam pontos</h3><span style={DEMO}>rede em expansão</span></div>
          <div className="tile-list">
            {HOTELS.map((h) => (
              <div className="tile-row" key={h.name}>
                <div className="tile-emoji">{h.k}</div>
                <div className="tile-body"><div className="tile-title">{h.name}</div><div className="tile-sub">{h.rt}</div></div>
                <div className="tile-meta">Estadia</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="section-head"><h3>Voos com milhas</h3><span style={DEMO}>demo</span></div>
          <div className="tile-list">
            {AIRLINES.map((a) => (
              <div className="tile-row" key={a.name}>
                <div className="tile-emoji">{a.k}</div>
                <div className="tile-body"><div className="tile-title">{a.name}</div><div className="tile-sub">{a.rt}</div></div>
                <div className="tile-meta">Voar</div>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 14 }}>Busca de voos/hotéis e reservas entrarão com integração dos parceiros.</p>
        </div>
      </div>
    </>
  )
}
