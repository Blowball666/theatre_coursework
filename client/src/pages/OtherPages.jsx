import { useState, useEffect } from 'react';

async function fetchHalls() {
  const res = await fetch('/api/halls-full');
  const data = await res.json();
  return data.data;
}

const SECTION_COLORS = {
  'Партер':    '#EF4444',
  'Балкон':    '#3B82F6',
  'Ложа':      '#8B5CF6',
  'Амфитеатр': '#22C55E',
  'VIP':       '#F59E0B',
};

function HallScheme({ sections }) {
  return (
    <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:12 }}>
      {sections.map(sec => (
        <div key={sec.id}>
          <div style={{ fontSize:11, color:'var(--dark-75)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:6 }}>
            {sec.type}
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            {sec.rows.sort((a,b) => b.number - a.number).map(row => (
              <div key={row.id} style={{ display:'flex', gap:3 }}>
                {Array.from({ length: row.seat_count }).map((_, i) => (
                  <div key={i} style={{
                    width:12, height:12, borderRadius:'50%',
                    background: SECTION_COLORS[sec.type] || '#888',
                    opacity: 0.8,
                  }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ textAlign:'center', marginTop:8 }}>
        <div style={{ borderTop:'2px solid var(--dark)', width:100, margin:'0 auto 4px' }} />
        <span style={{ fontSize:12, color:'var(--dark-75)' }}>Сцена</span>
      </div>
    </div>
  );
}

export function HallsPage() {
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHalls().then(setHalls).catch(() => setHalls([])).finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <div className="container" style={{ paddingTop:48, paddingBottom:60 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:500, textAlign:'center', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:40 }}>
          Планы залов
        </h1>

        {loading && <div className="loading-state"><div className="spinner" /></div>}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20 }}>
          {halls.map(hall => (
            <div key={hall.id} style={{ background:'var(--light)', borderRadius:12, padding:24 }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:500, marginBottom:4 }}>
                {hall.name}
              </div>
              <div style={{ fontSize:13, color:'var(--dark-75)', marginBottom:12 }}>
                {hall.total_seats} мест
              </div>

              <HallScheme sections={hall.sections} />

              <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:4 }}>
                {hall.sections.map(s => (
                  <span key={s.id} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--dark-75)' }}>
                    <span style={{ width:10, height:10, borderRadius:'50%', background: SECTION_COLORS[s.type] || '#888', flexShrink:0 }} />
                    {s.type}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export function ContactsPage() {
  return (
    <main>
      <div className="container" style={{ paddingTop:48, paddingBottom:60 }}>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:500, textAlign:'center', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:40 }}>
          Контакты
        </h1>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, marginBottom:48 }}>
          <div>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:500, marginBottom:8 }}>Адрес</h3>
            <p style={{ fontSize:15, color:'var(--dark-75)', marginBottom:24 }}>тут будет адрес....</p>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:500, marginBottom:8 }}>Номер телефона</h3>
            <p style={{ fontSize:15 }}>8(999)999-99-99</p>
          </div>
          <div>
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:500, marginBottom:8 }}>Режим работы</h3>
            <p style={{ fontSize:15, color:'var(--dark-75)', lineHeight:2 }}>
              пн-пт с 9:00 до 18:00<br />
              сб с 10:00 до 15:00<br />
              вс выходной<br />
              (обед с 12:00 до 13:00)
            </p>
          </div>
        </div>

        <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:500, textAlign:'center', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:20 }}>
          Мы на карте
        </h2>

        <div style={{ borderRadius:12, overflow:'hidden', height:420 }}>
          <iframe
            title="Карта"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d72244.91!2d31.2!3d58.52!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x469551df1232c5a9%3A0xd5a817c1cfe7c1bd!2z0JLQtdC70LjQutC40Lkg0J3QvtCy0LPQvtGA0L7QtA!5e0!3m2!1sru!2sru!4v1"
            width="100%" height="100%" style={{ border:0, display:'block' }}
            allowFullScreen loading="lazy"
          />
        </div>
      </div>
    </main>
  );
}