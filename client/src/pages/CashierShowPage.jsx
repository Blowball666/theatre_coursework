import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShowById, getPerformanceSeats } from '../api';
import ShowImage from '../components/ShowImage';
import { useAuth } from '../context/AuthContext';
import { AgeBadge, TicketBadge } from '../components/MetaBadges';

const MONTHS_SHORT = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const MONTHS_FULL  = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function fmtShort(str) {
  const d = new Date(str);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()].toUpperCase()}`;
}

function seatPrice(basePrice, dbSurcharge) {
  return Number(basePrice) + Number(dbSurcharge || 0);
}

function seatColor(price) {
  if (price < 1600) return '#3B82F6';
  if (price < 1900) return '#22C55E';
  if (price < 2200) return '#EAB308';
  return '#EF4444';
}

function groupRows(seats) {
  const sections = {};
  for (const s of seats) {
    if (!sections[s.section_id]) sections[s.section_id] = {};
    if (!sections[s.section_id][s.row_id]) {
      sections[s.section_id][s.row_id] = {
        row_id: s.row_id, number: s.number_in_section,
        surcharge: Number(s.surcharge || 0),
        section_type: s.section_type, section_id: s.section_id, seats: [],
      };
    }
    sections[s.section_id][s.row_id].seats.push(s);
  }
  const result = [];
  for (const secRows of Object.values(sections)) {
    const rows = Object.values(secRows).sort((a,b) => b.number - a.number);
    const maxRow = Math.max(...rows.map(r => r.number));
    for (const row of rows) result.push({ ...row, maxRowInSection: maxRow });
  }
  return result;
}

function buildLegend(rows, basePrice) {
  const seen = new Set(); const result = [];
  for (const row of rows) {
    const price = seatPrice(basePrice, row.surcharge);
    const color = seatColor(price);
    if (!seen.has(color)) { seen.add(color); result.push({ color, price }); }
  }
  return result.sort((a,b) => a.price - b.price);
}

// Форма выбора покупателя и продажи
function SellModal({ selected, total, perf, show, onConfirm, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSell = async () => {
    if (!email.trim()) { setError('Введите email покупателя'); return; }
    setLoading(true); setError('');
    try {
      const userRes = await fetch(`/api/cashier/find-user?email=${encodeURIComponent(email)}`);
      const userData = await userRes.json();
      if (!userData.success) throw new Error('Пользователь не найден');

      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.data.id, performanceId: perf.id, seatIds: selected.map(s => s.seat_id) }),
      });
      const orderData = await orderRes.json();
      if (!orderData.success) throw new Error(orderData.message);

      // Сразу помечаем как оплачен
      await fetch(`/api/orders/${orderData.data.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Оплачен' }),
      });

      onConfirm(orderData.data);
    } catch (e) {
      setError(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Продажа билета</h2>
        <p style={{ fontSize:14, color:'var(--dark-75)', marginBottom:20 }}>
          {selected.length} {selected.length===1?'место':'места'} — {total.toLocaleString('ru-RU')} ₽
        </p>
        <label style={{ fontSize:13, display:'flex', flexDirection:'column', gap:6, marginBottom:16 }}>
          Email покупателя
          <input className="field" type="email" placeholder="client@mail.ru"
            value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        {error && <p style={{ color:'#dc2626', fontSize:13, marginBottom:12 }}>{error}</p>}
        <div style={{ display:'flex', gap:14 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" style={{ flex:1 }} disabled={loading} onClick={handleSell}>
            {loading ? '...' : 'Продать'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CashierShowPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [show, setShow]               = useState(null);
  const [perf, setPerf]               = useState(null);
  const [seats, setSeats]             = useState([]);
  const [selected, setSelected]       = useState([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [sellModal, setSellModal]     = useState(false);
  const [successModal, setSuccessModal] = useState(null);

  useEffect(() => {
    if (!user || user.role_id !== 2) { navigate('/'); return; }
    getShowById(id).then(data => {
      setShow(data);
      if (data.performances?.length) setPerf(data.performances[0]);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!perf) return;
    setLoadingSeats(true); setSelected([]);
    getPerformanceSeats(perf.id).then(setSeats).catch(() => setSeats([])).finally(() => setLoadingSeats(false));
  }, [perf]);

  const toggle = (seat, price) => {
    if (seat.is_taken) return;
    setSelected(prev =>
      prev.find(s => s.seat_id === seat.seat_id)
        ? prev.filter(s => s.seat_id !== seat.seat_id)
        : [...prev, { ...seat, _price: price }]
    );
  };

  const total = selected.reduce((s, x) => s + x._price, 0);

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
          <ShowImage src={show.photo} alt={show.name} style={{ width:'100%', height:300, objectFit:'cover', borderRadius:8 }} />
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:500, marginBottom:6 }}>Описание</div>
            <p style={{ fontSize:14, color:'var(--dark-75)', lineHeight:1.7, marginBottom:20 }}>{show.description || '—'}</p>
            <div style={{ fontFamily:'var(--font-display)', fontSize:17, fontWeight:500, marginBottom:6 }}>Зал</div>
            <p style={{ fontSize:14, color:'var(--dark-75)', marginBottom:20 }}>{perf?.hall_name || '—'}</p>
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
                color: perf?.id===p.id ? 'var(--white)' : 'var(--dark)',
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
                            <div style={{ fontSize:11, color:'var(--dark-75)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:ri===0?0:12, marginBottom:4 }}>
                              {row.section_type}
                            </div>
                          )}
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <span style={{ width:22, fontSize:12, color:'var(--dark-75)', textAlign:'right', flexShrink:0 }}>{row.number}</span>
                            <div style={{ display:'flex', gap:3 }}>
                              {row.seats.sort((a,b) => a.number_in_row - b.number_in_row).map(seat => {
                                const isSel = selected.find(s => s.seat_id === seat.seat_id);
                                return (
                                  <button key={seat.seat_id} onClick={() => toggle(seat, price)}
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
                            <span style={{ width:22, fontSize:12, color:'var(--dark-75)', flexShrink:0 }}>{row.number}</span>
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
                  <div key={s.seat_id} style={{ background:'var(--white)', borderRadius:8, padding:'10px 14px', marginBottom:10, fontSize:14, border:'1px solid #ddd' }}>
                    <div style={{ fontWeight:500 }}>{s.number_in_section} ряд, {s.number_in_row} место</div>
                    <div style={{ color:'var(--dark-75)', fontSize:13 }}>{s.section_type}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:15 }}>{s._price?.toLocaleString('ru-RU')} ₽</div>
                  </div>
                ))}
                {selected.length > 0 && (
                  <div style={{ textAlign:'right', margin:'12px 0 16px' }}>
                    <div style={{ fontSize:15 }}>{selected.length} {selected.length===1?'билет':'билета'}:</div>
                    <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:500 }}>{total.toLocaleString('ru-RU')} ₽</div>
                  </div>
                )}
                <button className="btn btn-primary" style={{ width:'100%' }}
                  disabled={!selected.length} onClick={() => setSellModal(true)}>
                  Продать билет
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {sellModal && (
        <SellModal
          selected={selected} total={total} perf={perf} show={show}
          onConfirm={(order) => { setSellModal(false); setSuccessModal(order); }}
          onClose={() => setSellModal(false)}
        />
      )}

      {successModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ textAlign:'center' }}>
            <h2 className="modal-title">Билет продан</h2>
            <p style={{ fontSize:15, color:'var(--dark-75)', marginBottom:28 }}>
              Заказ №{successModal.id} успешно оформлен и оплачен
            </p>
            <button className="btn btn-primary" onClick={() => { setSuccessModal(null); navigate('/cashier'); }}>
              Вернуться к афише
            </button>
          </div>
        </div>
      )}
    </main>
  );
}