import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ShowImage from '../components/ShowImage';
import { ClockBadge, TicketBadge, AgeBadge } from '../components/MetaBadges';

const MONTHS = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const MONTHS_FULL = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function fmtDate(str) {
  const d = new Date(str);
  return { day: d.getDate(), month: MONTHS[d.getMonth()].toUpperCase() };
}

function fmtDateTime(str) {
  const d = new Date(str);
  return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function fmtFull(str) {
  const d = new Date(str);
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;
}

// Модальное окно просмотра билета из проданных
function TicketViewModal({ ticket, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Билет</h2>
        <div style={{ background:'var(--white)', borderRadius:8, padding:24, marginBottom:24 }}>
          {[
            ['Шоу', ticket.show_name],
            ['Дата показа', fmtFull(ticket.perf_date)],
            ['Время', ticket.perf_time?.slice(0,5)],
            ['Место', `место ${ticket.seat_id}`],
            ['Покупатель', ticket.buyer],
            ['Дата покупки', fmtDateTime(ticket.created_at)],
            ['Номер заказа', ticket.order_id],
            ['Статус', ticket.payment_status],
          ].map(([label, val]) => (
            <div key={label} style={{ display:'flex', gap:8, marginBottom:10, fontSize:15 }}>
              <span style={{ color:'var(--dark-75)', minWidth:160 }}>{label}:</span>
              <span>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

// Афиша для кассира
function CashierAfisha() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate]       = useState('');
  const navigate = useNavigate();

  const load = (d) => {
    setLoading(true);
    const q = d ? `?dateFrom=${d}` : '';
    fetch(`/api/shows/afisha?limit=50${q ? '&dateFrom='+d : ''}`)
      .then(r => r.json()).then(r => setItems(r.data || []))
      .catch(() => setItems([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(''); }, []);

  return (
    <div>
      <h2 className="section-title">Афиша</h2>
      <div style={{ display:'flex', gap:12, marginBottom:24, alignItems:'flex-end' }}>
        <label style={{ fontSize:13, display:'flex', flexDirection:'column', gap:4 }}>
          Дата
          <input type="date" value={date} onChange={e => { setDate(e.target.value); load(e.target.value); }}
            className="field" style={{ width:'auto' }} />
        </label>
        {date && <button className="btn btn-outline" onClick={() => { setDate(''); load(''); }}>Сбросить</button>}
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
              <button className="btn btn-primary" onClick={() => navigate(`/cashier/show/${item.show_id}`)}>
                Продать билет
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Проданные билеты
const FILTERS = [
  { label: 'Сегодня',  value: 'today' },
  { label: 'Вчера',    value: 'yesterday' },
  { label: 'Неделя',   value: 'week' },
  { label: 'Месяц',    value: 'month' },
  { label: 'Все',      value: 'all' },
];

function SoldTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('today');
  const [modal, setModal]     = useState(null);

  const load = (f) => {
    setLoading(true);
    fetch(`/api/cashier/tickets?period=${f}`)
      .then(r => r.json()).then(r => setTickets(r.data || []))
      .catch(() => setTickets([])).finally(() => setLoading(false));
  };

  useEffect(() => { load(filter); }, [filter]);

  return (
    <div>
      <h2 className="section-title">Проданные билеты</h2>

      <div style={{ display:'flex', gap:8, marginBottom:24 }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={filter === f.value ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding:'6px 16px', fontSize:13 }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-state"><div className="spinner" /></div>}
      {!loading && !tickets.length && <div className="empty-state">Нет проданных билетов</div>}

      <div className="afisha-list">
        {tickets.map((t, i) => {
          const { day, month } = fmtDate(t.perf_date);
          return (
            <div key={i} className="afisha-card">
              <div style={{ minWidth:70 }}>
                <div style={{ fontSize:12, color:'var(--dark-75)', marginBottom:4 }}>{fmtDateTime(t.created_at)}</div>
                <div className="afisha-date" style={{ marginTop:0 }}>
                  <span className="afisha-date__day">{day}</span>
                  <span className="afisha-date__month">{month}</span>
                </div>
              </div>
              <ShowImage src={t.photo} alt={t.show_name} className="afisha-card__img" />
              <div className="afisha-card__info">
                <div className="afisha-card__title">{t.show_name}</div>
                <div className="afisha-card__desc">{t.description || 'тут будет описание....'}</div>
                <div className="afisha-card__meta">
                  <ClockBadge time={t.perf_time?.slice(0,5)} />
                  <AgeBadge rating={t.age_rating || '0+'} />
                  <TicketBadge price={t.price} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => setModal(t)}>
                Просмотреть билет
              </button>
            </div>
          );
        })}
      </div>

      {modal && <TicketViewModal ticket={modal} onClose={() => setModal(null)} />}
    </div>
  );
}

// Основная страница кассира
const TABS = ['Афиша', 'Проданные билеты'];

export default function CashierPage({ tab: initialTab = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (!user || user.role_id !== 2) navigate('/');
  }, [user]);

  if (!user || user.role_id !== 2) return null;

  return (
    <main>
      <div className="container" style={{ paddingTop:40, paddingBottom:60 }}>
        <div style={{ display:'flex', gap:0, borderBottom:'2px solid var(--light)', marginBottom:32 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding:'10px 28px', background:'transparent', border:'none',
              borderBottom: tab===i ? '2px solid var(--dark)' : '2px solid transparent',
              marginBottom:-2, fontFamily:'var(--font-display)', fontSize:16, fontWeight:500,
              cursor:'pointer', color: tab===i ? 'var(--dark)' : 'var(--dark-75)',
              textTransform:'uppercase', letterSpacing:'0.04em',
            }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && <CashierAfisha />}
        {tab === 1 && <SoldTickets />}
      </div>
    </main>
  );
}