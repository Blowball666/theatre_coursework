import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserOrders } from '../api';
import ShowImage from '../components/ShowImage';
import { ClockBadge, AgeBadge } from '../components/MetaBadges';

const MONTHS_SHORT = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const MONTHS_FULL  = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function fmtShort(str) {
  const d = new Date(str);
  return { day: d.getDate(), month: MONTHS_SHORT[d.getMonth()].toUpperCase() };
}
function fmtFull(str) {
  const d = new Date(str);
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;
}

// Модальное окно редактирования данных
function EditModal({ user, onClose, onSave }) {
  const [fio, setFio]           = useState([user.last_name, user.first_name, user.middle_name].filter(Boolean).join(' '));
  const [dob, setDob]           = useState(user.date_of_birth?.slice(0,10) || '');
  const [email, setEmail]       = useState(user.email || '');
  const [password, setPassword] = useState('');

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Изменить данные</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input className="field" style={{ borderRadius:40 }} placeholder="ФИО" value={fio} onChange={e => setFio(e.target.value)} />
          <input className="field" style={{ borderRadius:40 }} placeholder="Дата рождения" type="date" value={dob} onChange={e => setDob(e.target.value)} />
          <input className="field" style={{ borderRadius:40 }} placeholder="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="field" style={{ borderRadius:40 }} placeholder="новый пароль (необязательно)" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div style={{ display:'flex', gap:14, marginTop:24 }}>
          <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Отмена</button>
          <button className="btn btn-primary" style={{ flex:1 }} onClick={() => onSave({ fio, dob, email, password })}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

function printTickets(tickets, order, user) {
  const MONTHS_FULL = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const fmtDate = (str) => {
    const d = new Date(str);
    return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]}`;
  };
  const fio = user ? `${user.last_name} ${user.first_name} ${user.middle_name||''}`.trim() : '—';

  const ticketsHtml = tickets.map((t, i) => `
    <div style="page-break-after: always; padding: 40px; font-family: Arial, sans-serif;">
      <h2 style="text-align:center; margin-bottom:32px;">Билет ${i+1} из ${tickets.length}</h2>
      <table style="width:100%; font-size:16px; border-collapse:collapse;">
        <tr><td style="padding:8px 0; color:#666; width:180px;">Шоу:</td><td style="padding:8px 0;"><b>${t.show_name}</b></td></tr>
        <tr><td style="padding:8px 0; color:#666;">Дата:</td><td style="padding:8px 0;">${fmtDate(t.date)}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">Время:</td><td style="padding:8px 0;">${t.time?.slice(0,5)}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">Место:</td><td style="padding:8px 0;">место ${t.seat_id}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">ФИО посетителя:</td><td style="padding:8px 0;">${fio}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">Номер заказа:</td><td style="padding:8px 0;">${order.order_id}</td></tr>
        <tr><td style="padding:8px 0; color:#666;">Статус:</td><td style="padding:8px 0;">${order.payment_status}</td></tr>
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

// Модальное окно просмотра билетов заказа
function OrderTicketsModal({ order, user, onClose }) {
  const [tab, setTab] = useState(0);
  const tickets = order.tickets || [];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h2 className="modal-title">Билеты</h2>
        <div style={{ display:'flex', borderBottom:'1px solid #ccc', marginBottom:20 }}>
          {tickets.map((_, i) => (
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
        {tickets[tab] && (
          <div style={{ background:'var(--white)', borderRadius:8, padding:24, marginBottom:24 }}>
            {[
              ['Шоу', tickets[tab].show_name],
              ['Дата', fmtFull(tickets[tab].date)],
              ['Время', tickets[tab].time?.slice(0,5)],
              ['Место', `место ${tickets[tab].seat_id}`],
              ['ФИО посетителя', user ? `${user.last_name} ${user.first_name} ${user.middle_name||''}`.trim() : '—'],
              ['Номер заказа', order.order_id],
              ['Статус', order.payment_status],
            ].map(([label, val]) => (
              <div key={label} style={{ display:'flex', gap:8, marginBottom:10, fontSize:15 }}>
                <span style={{ color:'var(--dark-75)', minWidth:160 }}>{label}:</span>
                <span>{val}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
          <button className="btn btn-outline" onClick={onClose}>Закрыть</button>
          <button className="btn btn-primary" onClick={() => printTickets(tickets, order, user)}>Печать</button>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    getUserOrders(user.id)
      .then(setOrders).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const handleSave = async ({ fio, dob, email, password }) => {
    const parts = fio.trim().split(/\s+/);
    const body = {
      last_name:   parts[0] || '',
      first_name:  parts[1] || '',
      middle_name: parts.slice(2).join(' ') || '',
      email,
      date_of_birth: dob || null,
      password: password || undefined,
    };
    try {
      const res = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const updated = { ...user, ...data.data };
      localStorage.setItem('theatre_user', JSON.stringify(updated));
      setEditOpen(false);
      window.location.reload();
    } catch (err) {
      alert('Ошибка сохранения: ' + err.message);
    }
  };

  return (
    <main>
      <div className="container" style={{ paddingTop:40, paddingBottom:60 }}>

        <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:20 }}>
          Ваши данные аккаунта
        </h2>

        <div style={{ background:'var(--light)', borderRadius:12, padding:'28px 32px', maxWidth:500, marginBottom:16 }}>
          {[
            ['ФИО', [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(' ')],
            ['Email', user.email],
            ['Дата рождения', user.date_of_birth ? fmtFull(user.date_of_birth) : '—'],
            ['Роль', user.role_name || 'Клиент'],
          ].map(([label, val]) => (
            <div key={label} style={{ display:'flex', gap:12, marginBottom:12, fontSize:15 }}>
              <span style={{ color:'var(--dark-75)', minWidth:140 }}>{label}:</span>
              <span>{val}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:14, marginBottom:48 }}>
          <button className="btn btn-primary" onClick={() => setEditOpen(true)}>Изменить данные</button>
          <button className="btn btn-outline" onClick={() => { logout(); navigate('/'); }}>Выйти из аккаунта</button>
        </div>

        <h2 style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:20 }}>
          История покупок
        </h2>

        {loading && <div className="loading-state"><div className="spinner" /></div>}
        {!loading && !orders.length && <div className="empty-state">У вас пока нет покупок</div>}

        <div className="afisha-list">
          {orders.map(order => {
            const first = order.tickets?.[0];
            if (!first) return null;
            const { day, month } = fmtShort(first.date);
            const count = order.tickets.length;
            return (
              <div key={order.order_id} className="afisha-card">
                <div className="afisha-date">
                  <span className="afisha-date__day">{day}</span>
                  <span className="afisha-date__month">{month}</span>
                </div>
                <ShowImage src={first.photo} alt={first.show_name} className="afisha-card__img" />
                <div className="afisha-card__info">
                  <div className="afisha-card__title">{first.show_name}</div>
                  <div className="afisha-card__desc">{first.description || '—'}</div>
                  <div className="afisha-card__meta">
                    <ClockBadge time={first.time?.slice(0,5)} />
                    <AgeBadge rating={first.age_rating || '0+'} />
                    <span style={{ fontSize:13, padding:'2px 10px', borderRadius:20, background:'var(--white)', border:'1px solid #ddd' }}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => setModal(order)}>
                  Просмотреть билет{count > 1 ? 'ы' : ''}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {editOpen && <EditModal user={user} onClose={() => setEditOpen(false)} onSave={handleSave} />}
      {modal && <OrderTicketsModal order={modal} user={user} onClose={() => setModal(null)} />}
    </main>
  );
}