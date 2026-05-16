import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShowById, getPerformanceSeats, createOrder } from '../api';
import ShowImage from '../components/ShowImage';
import { useAuth } from '../context/AuthContext';
import { AgeBadge, TicketBadge } from '../components/MetaBadges';

const MONTHS_SHORT = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const MONTHS_FULL  = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function fmtShort(str) {
  const d = new Date(str);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()].toUpperCase()}`;
}
function fmtFull(str) {
  const d = new Date(str);
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;
}

function seatPrice(basePrice, dbSurcharge) {
  return Number(basePrice) + Number(dbSurcharge || 0);
}

function groupRows(seats) {
  // Группируем по секциям, внутри — по рядам
  const sections = {};
  for (const s of seats) {
    if (!sections[s.section_id]) sections[s.section_id] = {};
    if (!sections[s.section_id][s.row_id]) {
      sections[s.section_id][s.row_id] = {
        row_id: s.row_id,
        number: s.number_in_section,
        surcharge: Number(s.surcharge || 0),
        section_type: s.section_type,
        section_id: s.section_id,
        seats: [],
      };
    }
    sections[s.section_id][s.row_id].seats.push(s);
  }

  // Для каждой секции находим максимальный номер ряда
  const result = [];
  for (const secRows of Object.values(sections)) {
    const rows = Object.values(secRows).sort((a, b) => b.number - a.number);
    const maxRow = Math.max(...rows.map(r => r.number));
    for (const row of rows) {
      result.push({ ...row, maxRowInSection: maxRow });
    }
  }
  return result;
}
function seatColor(price) {
  if (price < 1600) return '#3B82F6';
  if (price < 1900) return '#22C55E';
  if (price < 2200) return '#EAB308';
  return '#EF4444'; 
}

// Легенда цен (уникальные цвета)
function buildLegend(rows, basePrice) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const price = seatPrice(basePrice, row.surcharge, row.number, row.maxRowInSection);
    const color = seatColor(price);
    if (!seen.has(color)) { seen.add(color); result.push({ color, price }); }
  }
  return result.sort((a, b) => a.price - b.price);
}

function printTickets(tickets, order, show, perf, user) {
  const MONTHS_FULL = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const d = new Date(perf.date);
  const dateStr = `${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;
  const fio = user ? `${user.last_name} ${user.first_name} ${user.middle_name||''}`.trim() : '—';

  const ticketsHtml = tickets.map((t, i) => `
    <div style="page-break-after: always; padding: 40px; font-family: Arial, sans-serif;">
      <h2 style="text-align:center; margin-bottom:32px;">Билет ${i+1} из ${tickets.length}</h2>
      <table style="width:100%; font-size:16px; border-collapse:collapse;">
        <tr><td style="padding:8px 0; color:#666; width:180px;">Шоу:</td><td style="padding:8px 0;"><b>${show.name}</b></td></tr>
        <tr><td style="padding:8px 0; color:#666;">Дата:</td><td style="padding:8px 0;">${dateStr}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">Время:</td><td style="padding:8px 0;">${perf.time?.slice(0,5)}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">Сектор:</td><td style="padding:8px 0;">${t.section_type}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">Место:</td><td style="padding:8px 0;">${t.number_in_section} ряд, ${t.number_in_row} место</td></tr>
        <tr><td style="padding:8px 0; color:#666;">ФИО посетителя:</td><td style="padding:8px 0;">${fio}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">Номер заказа:</td><td style="padding:8px 0;">${order.id}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">Стоимость:</td><td style="padding:8px 0;">${t._price?.toLocaleString('ru-RU')} ₽</td></tr>
      </table>
    </div>
  `).join('');

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed; top:-9999px; left:-9999px; width:0; height:0; border:none;';
  document.body.appendChild(iframe);
  iframe.contentDocument.write(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${ticketsHtml}</body></html>`);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);
}

function TicketModal({ order, seats, perf, show, user, onClose }) {
  const [tab, setTab] = useState(0);
  const dateStr = fmtFull(perf.date);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Билеты</h2>

        <div style={{ display:'flex', borderBottom:'1px solid #ccc', marginBottom:20 }}>
          {seats.map((_, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding:'8px 18px', background:'transparent', border:'none',
              borderBottom: tab===i ? '2px solid var(--dark)' : '2px solid transparent',
              fontFamily:'var(--font-body)', fontSize:14, cursor:'pointer',
              color: tab===i ? 'var(--dark)' : 'var(--dark-75)',
            }}>
              {i+1} билет
            </button>
          ))}
        </div>

        {seats[tab] && (
          <div style={{ background:'var(--white)', borderRadius:8, padding:24, marginBottom:24 }}>
            {[
              ['Шоу', show.name],
              ['Дата', dateStr],
              ['Время', perf.time?.slice(0,5)],
              ['Сектор', seats[tab].section_type],
              ['Место', `${seats[tab].number_in_section} ряд, ${seats[tab].number_in_row} место`],
              ['ФИО посетителя', user ? `${user.last_name} ${user.first_name} ${user.middle_name||''}`.trim() : '—'],
              ['Номер заказа', order.id],
              ['Стоимость', `${seats[tab]._price?.toLocaleString('ru-RU')} ₽`],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', gap:8, marginBottom:10, fontSize:15 }}>
                <span style={{ color:'var(--dark-75)' }}>{label}:</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Закрыть</button>
          <button className="btn btn-primary" onClick={() => printTickets(seats, order, show, perf, user)}>Печать</button>
        </div>
      </div>
    </div>
  );
}

// Основная страница
export default function ShowPage({ onAuthClick }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow]               = useState(null);
  const [perf, setPerf]               = useState(null);
  const [seats, setSeats]             = useState([]);
  const [selected, setSelected]       = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [buying, setBuying]           = useState(false);
  const [error, setError]             = useState('');
  const [ticketModal, setTicketModal] = useState(null);

  useEffect(() => {
    getShowById(id).then(data => {
      setShow(data);
      if (data.performances?.length) setPerf(data.performances[0]);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!perf) return;
    setLoadingSeats(true);
    setSelected([]);
    getPerformanceSeats(perf.id)
      .then(setSeats).catch(() => setSeats([])).finally(() => setLoadingSeats(false));
  }, [perf]);

  const toggle = (seat, price) => {
    if (seat.is_taken) return;
    const key = seat.seat_id;
    setSelected(prev =>
      prev.find(s => s.seat_id === key)
        ? prev.filter(s => s.seat_id !== key)
        : [...prev, { ...seat, _price: price }]
    );
  };

  const total = selected.reduce((s, x) => s + x._price, 0);
  const [authPrompt, setAuthPrompt] = useState(false);

  const handleBuy = async () => {
    if (!user) {
      setAuthPrompt(true);
      return;
    }
    if (!selected.length) return;

    const confirmed = window.confirm(
      `Подтвердите заказ: ${selected.length} ${selected.length === 1 ? 'билет' : 'билета'} на сумму ${total.toLocaleString('ru-RU')} ₽`
    );
    if (!confirmed) return;

    setBuying(true); setError('');
    try {
      const order = await createOrder({ userId: user.id, performanceId: perf.id, seatIds: selected.map(s => s.seat_id) });
      setTicketModal({ order, seats: selected, perf });
    } catch (e) {
      setError(e.message || 'Ошибка');
    } finally {
      setBuying(false);
    }
  };

  if (!show) return <div className="loading-state"><div className="spinner" /></div>;

  const rows = groupRows(seats);
  const legend = buildLegend(rows, show.price);

  return (
    <main>
      <div className="container" style={{ paddingTop:36, paddingBottom:60 }}>

        <h1 style={{ fontFamily:'var(--font-display)', fontSize:28, fontWeight:500, textAlign:'center', marginBottom:28 }}>
          {show.name}
        </h1>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32, marginBottom:40 }}>
          <ShowImage src={show.photo} alt={show.name}
            style={{ width:'100%', height:300, objectFit:'cover', borderRadius:8 }} />
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:500, marginBottom:6 }}>Описание</div>
            <p style={{ fontSize:14, color:'var(--dark-75)', lineHeight:1.7, marginBottom:20 }}>
              {show.description || '—'}
            </p>
            <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:500, marginBottom:6 }}>Актёры</div>
            <p style={{ fontSize:14, color:'var(--dark-75)', lineHeight:2, marginBottom:20 }}>
              {show.actors?.length
                ? show.actors.map(a => `${a.last_name} ${a.first_name}`).join('\n')
                : 'Список актёрского состава...'}
            </p>
            <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:500, marginBottom:6 }}>Зал</div>
            <p style={{ fontSize:14, color:'var(--dark-75)', marginBottom:20 }}>
              {perf?.hall_name || '—'}
            </p>
            <div className="afisha-card__meta">
              <AgeBadge rating={show.age_rating} />
              <TicketBadge price={show.price} />
            </div>
          </div>
        </div>

        {show.performances?.length > 0 && (
          <div style={{ display:'flex', gap:12, justifyContent:'center', marginBottom:40, flexWrap:'wrap' }}>
            {show.performances.map(p => (
              <button key={p.id} onClick={() => setPerf(p)} style={{
                padding:'12px 20px', borderRadius:8, minWidth:90, textAlign:'center',
                border:'1.5px solid var(--dark)', cursor:'pointer', lineHeight:1.4,
                background: perf?.id===p.id ? 'var(--dark)' : 'transparent',
                color:       perf?.id===p.id ? 'var(--white)' : 'var(--dark)',
                fontFamily:'var(--font-display)', fontSize:15, fontWeight:500,
              }}>
                <div>{fmtShort(p.date)}</div>
                <div>{p.time?.slice(0,5)}</div>
              </button>
            ))}
          </div>
        )}

        {perf && (
          <div style={{ background:'var(--light)', borderRadius:12, padding:24 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 240px', gap:24, alignItems:'start' }}>

              <div>
                {legend.length > 0 && (
                  <div style={{ display:'flex', gap:18, marginBottom:20, flexWrap:'wrap' }}>
                    {legend.map(l => (
                      <span key={l.color} style={{ display:'flex', alignItems:'center', gap:6, fontSize:14 }}>
                        <span style={{ width:14, height:14, borderRadius:'50%', background:l.color, flexShrink:0 }} />
                        {l.price.toLocaleString('ru-RU')} ₽
                      </span>
                    ))}
                  </div>
                )}

                {loadingSeats && <div className="loading-state"><div className="spinner" /></div>}

                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                  {(() => {
                    let lastSection = null;
                    return rows.map((row, ri) => {
                      const price = seatPrice(show.price, row.surcharge);
                      const color = seatColor(price);
                      const showHeader = row.section_type !== lastSection;
                      lastSection = row.section_type;
                      return (
                        <div key={ri} style={{ width:'100%', display:'flex', flexDirection:'column', alignItems:'center' }}>
                          {showHeader && (
                            <div style={{ fontSize:11, color:'var(--dark-75)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop: ri===0 ? 0 : 12, marginBottom:4 }}>
                              {row.section_type}
                            </div>
                          )}
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ width:22, fontSize:12, color:'var(--dark-75)', textAlign:'right', flexShrink:0 }}>
                              {row.number}
                            </span>
                            <div style={{ display:'flex', gap:3 }}>
                              {row.seats.sort((a,b) => a.number_in_row - b.number_in_row).map(seat => {
                                const isSel = selected.find(s => s.seat_id === seat.seat_id);
                                return (
                                  <button key={seat.seat_id}
                                    onClick={() => toggle(seat, price)}
                                    title={`${row.section_type}, ряд ${row.number}, место ${seat.number_in_row} — ${price.toLocaleString('ru-RU')} ₽`}
                                    style={{
                                      width:22, height:22, borderRadius:'50%', border:'none',
                                      background: seat.is_taken ? '#bbb' : color,
                                      opacity: seat.is_taken ? 0.35 : 1,
                                      cursor: seat.is_taken ? 'not-allowed' : 'pointer',
                                      outline: isSel ? '2px solid var(--dark)' : 'none',
                                      transform: isSel ? 'scale(1.15)' : 'scale(1)',
                                      transition: 'transform 0.1s',
                                    }}
                                  />
                                );
                              })}
                            </div>
                            <span style={{ width:22, fontSize:12, color:'var(--dark-75)', flexShrink:0 }}>
                              {row.number}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {rows.length > 0 && (
                  <div style={{ textAlign:'center', marginTop:16 }}>
                    <div style={{ borderTop:'2px solid var(--dark)', width:200, margin:'0 auto 6px' }} />
                    <span style={{ fontSize:14, color:'var(--dark-75)' }}>Сцена</span>
                  </div>
                )}
              </div>

              <div>
                {selected.map(s => (
                  <div key={s.seat_id} style={{
                    background:'var(--white)', borderRadius:8, padding:'10px 14px',
                    marginBottom:10, fontSize:14, border:'1px solid #ddd',
                  }}>
                    <div style={{ fontWeight:500 }}>{s.number_in_section} ряд, {s.number_in_row} место</div>
                    <div style={{ color:'var(--dark-75)', fontSize:13 }}>{s.section_type}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:15 }}>
                      {s._price?.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                ))}

                {selected.length > 0 && (
                  <div style={{ textAlign:'right', margin:'12px 0 16px' }}>
                    <div style={{ fontSize:15 }}>{selected.length} {selected.length===1?'билет':'билета'}:</div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:500 }}>
                      {total.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                )}

                {error && <p style={{ color:'#dc2626', fontSize:13, marginBottom:10 }}>{error}</p>}

                <button className="btn btn-primary" style={{ width:'100%' }}
                  disabled={!selected.length || buying} onClick={handleBuy}>
                  {buying ? '...' : 'Купить билет'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {authPrompt && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setAuthPrompt(false)}>
          <div className="modal-box" style={{ textAlign:'center' }}>
            <h2 className="modal-title">Требуется авторизация</h2>
            <p style={{ fontSize:15, color:'var(--dark-75)', marginBottom:28 }}>
              Для покупки билетов необходимо войти в аккаунт или создать его
            </p>
            <div style={{ display:'flex', gap:14, justifyContent:'center' }}>
              <button className="btn btn-outline" onClick={() => { setAuthPrompt(false); onAuthClick('register'); }}>
                Создать аккаунт
              </button>
              <button className="btn btn-primary" onClick={() => { setAuthPrompt(false); onAuthClick('login'); }}>
                Войти
              </button>
            </div>
          </div>
        </div>
      )}

      {ticketModal && (
        <TicketModal
          {...ticketModal} show={show} user={user}
          onClose={() => { setTicketModal(null); navigate('/account'); }}
        />
      )}
    </main>
  );
}
