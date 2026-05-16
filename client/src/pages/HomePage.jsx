import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTodayShows, getAfisha } from '../api';
import ShowImage from '../components/ShowImage';
import { ClockBadge, TicketBadge, AgeBadge } from '../components/MetaBadges';

const MONTHS = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];

function fmtDate(str) {
  const d = new Date(str);
  return { day: d.getDate(), month: MONTHS[d.getMonth()].toUpperCase() };
}

// Сегодня в театре
function TodaySection() {
  const [shows, setShows]     = useState([]);
  const [active, setActive]   = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayShows().then(setShows).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <section className="today-section"><div className="container"><div className="spinner" /></div></section>;
  if (!shows.length) return null;

  return (
    <section className="today-section">
      <div className="container">
        <h2 className="section-title">Сегодня в театре</h2>
        <div className="today-grid">
          <ShowImage src={shows[active].photo} alt={shows[active].name} className="today-main-img" />
          <div className="today-list">
            {shows.map((s, i) => (
              <div key={s.id} className={`today-item${i === active ? ' today-item--active' : ''}`} onClick={() => setActive(i)}>
                <ShowImage src={s.photo} alt={s.name} className="today-item__thumb" />
                <span className="today-item__name">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Афиша с фильтрами
function AfishaSection() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate]       = useState('');
  const navigate = useNavigate();

  const load = (d) => {
    setLoading(true);
    getAfisha({ limit: 50, dateFrom: d || undefined })
      .then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(''); }, []);

  return (
    <section className="afisha-section" id="afisha">
      <div className="container">
        <h2 className="section-title">Афиша</h2>

        <div style={{ display:'flex', gap:12, marginBottom:24, alignItems:'flex-end' }}>
          <label style={{ fontSize:13, display:'flex', flexDirection:'column', gap:4 }}>
            Дата
            <input type="date" value={date} onChange={e => { setDate(e.target.value); load(e.target.value); }}
              className="field" style={{ width:'auto' }} />
          </label>
          {date && (
            <button className="btn btn-outline" onClick={() => { setDate(''); load(''); }}>
              Сбросить
            </button>
          )}
        </div>

        {loading && <div className="loading-state"><div className="spinner" /></div>}
        {!loading && !items.length && <div className="empty-state">Нет показов</div>}

        <div className="afisha-list">
          {items.map(item => {
            const { day, month } = fmtDate(item.date);
            return (
              <div key={item.performance_id} className="afisha-card">
                <div className="afisha-date">
                  <span className="afisha-date__day">{day}</span>
                  <span className="afisha-date__month">{month}</span>
                </div>
                <ShowImage src={item.photo} alt={item.name} className="afisha-card__img" />
                <div className="afisha-card__info">
                  <div className="afisha-card__title">{item.name}</div>
                  <div className="afisha-card__desc">{item.description || 'тут будет описание....'}</div>
                  <div className="afisha-card__meta">
                    <ClockBadge time={item.time?.slice(0,5)} />
                    <AgeBadge rating={item.age_rating} />
                    <TicketBadge price={item.price} />
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => navigate(`/show/${item.show_id}`)}>
                  Купить билет
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash === '#afisha') {
      setTimeout(() => document.getElementById('afisha')?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [location]);

  return (
    <main>
      <TodaySection />
      <AfishaSection />
    </main>
  );
}
