import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = (path, opts = {}) =>
  fetch(`/api${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts })
    .then(r => r.json()).then(d => d.data);

const AGE_RATINGS = ['0+', '6+', '12+', '16+', '18+'];

function bytesToBase64(data) {
  if (!data) return null;
  if (typeof data === 'string') return data;
  const arr = data.type === 'Buffer' ? data.data : (data.data || data);
  if (!arr || !arr.length) return null;
  let binary = '';
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function TableWrap({ children }) {
  return (
    <div style={{ background: 'var(--light)', borderRadius: 12, overflow: 'hidden', marginBottom: 32 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>{children}</table>
    </div>
  );
}

function Th({ children, w }) {
  return (
    <th style={{ padding: '12px 14px', textAlign: 'left', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 14, borderBottom: '1px solid #ddd', width: w }}>
      {children}
    </th>
  );
}

function Td({ children }) {
  return <td style={{ padding: '10px 14px', fontSize: 14, borderBottom: '1px solid #eee', verticalAlign: 'middle' }}>{children}</td>;
}

function InlineInput({ value, onChange, type = 'text', style = {} }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '4px 8px', border: '1px solid #ccc', borderRadius: 6, fontFamily: 'var(--font-body)', fontSize: 14, ...style }} />
  );
}

// Страница Шоу 
function ShowsTab() {
  const [rows, setRows]       = useState([]);
  const [edits, setEdits]     = useState({});
  const [saving, setSaving]   = useState(false);
  const fileRefs              = useRef({});

  useEffect(() => {
    API('/admin/shows').then(data => {
      setRows(data);
      const e = {};
      data.forEach(s => { e[s.id] = { name: s.name, description: s.description || '', price: s.price, age_rating: s.age_rating }; });
      setEdits(e);
    });
  }, []);

  const set = (id, field, val) => setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const handlePhoto = (id, file) => {
  const reader = new FileReader();
   reader.onload = () => {
     const img = new Image();
     img.onload = () => {
       const canvas = document.createElement('canvas');
       const MAX = 1200;
       let w = img.width, h = img.height;
       if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
       if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
       canvas.width = w;
       canvas.height = h;
       canvas.getContext('2d').drawImage(img, 0, 0, w, h);
       const compressed = canvas.toDataURL('image/jpeg', 0.8);
       const base64 = compressed.split(',')[1];
       setEdits(prev => ({ ...prev, [id]: { ...prev[id], _newPhoto: base64 } }));
       setRows(prev => prev.map(r => r.id === id ? { ...r, _previewPhoto: compressed } : r));
     };
     img.src = reader.result;
   };
   reader.readAsDataURL(file);
};

  const deletePhoto = (id) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], _deletePhoto: true, _newPhoto: null } }));
    setRows(prev => prev.map(r => r.id === id ? { ...r, _previewPhoto: null, photo: null } : r));
  };

  const deleteShow = async (id) => {
    if (!window.confirm('Удалить шоу?')) return;
    await fetch(`/api/admin/shows/${id}`, { method: 'DELETE' });
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const addRow = () => {
    const tmp = { id: `new_${Date.now()}`, name: '', description: '', price: 0, age_rating: '0+', photo: null, _new: true };
    setRows(prev => [...prev, tmp]);
    setEdits(prev => ({ ...prev, [tmp.id]: { name: '', description: '', price: 0, age_rating: '0+' } }));
  };

  const save = async () => {
      setSaving(true);
      try {
        for (const row of rows) {
          const e = edits[row.id];
          if (!e) continue;
          if (row._new) {
            await fetch('/api/admin/shows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
          } else {
            await fetch(`/api/admin/shows/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(e) });
            if (e._newPhoto) {
              await fetch(`/api/admin/shows/${row.id}/photo`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo: e._newPhoto }) });
            }
            if (e._deletePhoto) {
              await fetch(`/api/admin/shows/${row.id}/photo`, { method: 'DELETE' });
            }
          }
        }
        API('/admin/shows').then(data => {
          setRows(data);
          const e = {};
          data.forEach(s => { e[s.id] = { name: s.name, description: s.description || '', price: s.price, age_rating: s.age_rating }; });
          setEdits(e);
        });
      } finally {
        setSaving(false);
      }
    };

  return (
    <>
      <TableWrap>
        <thead>
          <tr>
            <Th w="18%">Название</Th>
            <Th w="22%">Описание</Th>
            <Th w="12%">Min цена</Th>
            <Th w="14%">Возрастное ограничение</Th>
            <Th w="14%">Фото</Th>
            <Th w="12%">Действия с фото</Th>
            <Th w="8%">Удаление записи</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const e = edits[row.id] || {};
            const imgSrc = row._previewPhoto
                ? row._previewPhoto
                : bytesToBase64(row.photo)
                  ? `data:image/jpeg;base64,${bytesToBase64(row.photo)}`
                  : null;
            return (
              <tr key={row.id}>
                <Td><InlineInput value={e.name || ''} onChange={v => set(row.id, 'name', v)} /></Td>
                <Td><InlineInput value={e.description || ''} onChange={v => set(row.id, 'description', v)} /></Td>
                <Td><InlineInput value={e.price || ''} onChange={v => set(row.id, 'price', v)} type="number" /></Td>
                <Td>
                  <select value={e.age_rating || '0+'} onChange={ev => set(row.id, 'age_rating', ev.target.value)}
                    style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontFamily: 'var(--font-body)', fontSize: 14 }}>
                    {AGE_RATINGS.map(r => <option key={r}>{r}</option>)}
                  </select>
                </Td>
                <Td>
                  {imgSrc
                    ? <img src={imgSrc} alt="" style={{ width: 90, height: 60, objectFit: 'cover', borderRadius: 4 }} />
                    : <span style={{ color: 'var(--dark-75)', fontSize: 13 }}>Нет фото</span>}
                </Td>
                <Td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      ref={el => fileRefs.current[row.id] = el}
                      onChange={e => e.target.files[0] && handlePhoto(row.id, e.target.files[0])} />
                    <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 13 }}
                      onClick={() => fileRefs.current[row.id]?.click()}>Выбрать</button>
                    {imgSrc && (
                      <button className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 13 }}
                        onClick={() => deletePhoto(row.id)}>Удалить</button>
                    )}
                  </div>
                </Td>
                <Td>
                  <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 13 }}
                    onClick={() => deleteShow(row.id)}>Удалить</button>
                </Td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={7} style={{ padding: '10px 14px' }}>
              <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={addRow}>+ Добавить шоу</button>
            </td>
          </tr>
        </tbody>
      </TableWrap>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" style={{ minWidth: 140 }} onClick={save} disabled={saving}>
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>
    </>
  );
}

// Страница Показов
function PerformancesTab() {
  const [rows, setRows]     = useState([]);
  const [shows, setShows]   = useState([]);
  const [halls, setHalls]   = useState([]);
  const [actors, setActors] = useState([]);
  const [edits, setEdits]   = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      API('/admin/performances'),
      API('/admin/shows'),
      API('/admin/halls'),
      API('/admin/actors'),
    ]).then(([perfs, sh, ha, ac]) => {
      setRows(perfs); setShows(sh); setHalls(ha); setActors(ac);
      const e = {};
      perfs.forEach(p => {
        e[p.id] = {
          date: p.date?.slice(0, 10),
          time: p.time?.slice(0, 5),
          show_id: p.show_id,
          hall_id: p.hall_id || '',
          actor_ids: p.actors?.map(a => a.id) || [],
        };
      });
      setEdits(e);
    });
  };

  useEffect(() => { load(); }, []);

  const set = (id, field, val) => setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const toggleActor = (id, actorId) => {
    const cur = edits[id]?.actor_ids || [];
    set(id, 'actor_ids', cur.includes(actorId) ? cur.filter(x => x !== actorId) : [...cur, actorId]);
  };

  const addRow = () => {
    const tmp = { id: `new_${Date.now()}`, _new: true };
    setRows(prev => [...prev, tmp]);
    setEdits(prev => ({ ...prev, [tmp.id]: { date: '', time: '', show_id: shows[0]?.id || '', hall_id: '', actor_ids: [] } }));
  };

  const deleteRow = async (id, isNew) => {
    if (isNew) { setRows(prev => prev.filter(r => r.id !== id)); return; }
    if (!window.confirm('Удалить показ?')) return;
    await fetch(`/api/admin/performances/${id}`, { method: 'DELETE' });
    load();
  };

  const save = async () => {
      setSaving(true);
      try {
        for (const row of rows) {
          const e = edits[row.id];
          if (!e) continue;
          const body = JSON.stringify({ ...e, show_id: parseInt(e.show_id), hall_id: e.hall_id ? parseInt(e.hall_id) : null });
          if (row._new) {
            await fetch('/api/admin/performances', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
          } else {
            await fetch(`/api/admin/performances/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
          }
        }
        load();
      } finally {
        setSaving(false);
      }
    };

  return (
    <>
      <TableWrap>
        <thead>
          <tr>
            <Th w="13%">Дата</Th>
            <Th w="10%">Время</Th>
            <Th w="18%">Шоу</Th>
            <Th w="15%">Зал</Th>
            <Th>Актёры</Th>
            <Th w="8%">Удалить</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const e = edits[row.id] || {};
            return (
              <tr key={row.id}>
                <Td><InlineInput type="date" value={e.date || ''} onChange={v => set(row.id, 'date', v)} /></Td>
                <Td><InlineInput type="time" value={e.time || ''} onChange={v => set(row.id, 'time', v)} /></Td>
                <Td>
                  <select value={e.show_id || ''} onChange={ev => set(row.id, 'show_id', ev.target.value)}
                    style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}>
                    {shows.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </Td>
                <Td>
                  <select value={e.hall_id || ''} onChange={ev => set(row.id, 'hall_id', ev.target.value)}
                    style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 14 }}>
                    <option value="">—</option>
                    {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </Td>
                <Td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {actors.map(a => {
                      const sel = (e.actor_ids || []).includes(a.id);
                      return (
                        <span key={a.id} onClick={() => toggleActor(row.id, a.id)}
                          style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, cursor: 'pointer', userSelect: 'none',
                            background: sel ? 'var(--dark)' : '#ddd', color: sel ? 'var(--white)' : 'var(--dark)' }}>
                          {a.last_name} {a.first_name[0]}.
                        </span>
                      );
                    })}
                  </div>
                </Td>
                <Td>
                  <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 13 }}
                    onClick={() => deleteRow(row.id, row._new)}>Удалить</button>
                </Td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={6} style={{ padding: '10px 14px' }}>
              <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={addRow}>+ Добавить показ</button>
            </td>
          </tr>
        </tbody>
      </TableWrap>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" style={{ minWidth: 140 }} onClick={save} disabled={saving}>
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>
    </>
  );
}

// Страница Актёров
function ActorsTab() {
  const [rows, setRows]     = useState([]);
  const [edits, setEdits]   = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    API('/admin/actors').then(data => {
      setRows(data);
      const e = {};
      data.forEach(a => { e[a.id] = { last_name: a.last_name, first_name: a.first_name, middle_name: a.middle_name || '' }; });
      setEdits(e);
    });
  };

  useEffect(() => { load(); }, []);

  const set = (id, field, val) => setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const addRow = () => {
    const tmp = { id: `new_${Date.now()}`, _new: true };
    setRows(prev => [...prev, tmp]);
    setEdits(prev => ({ ...prev, [tmp.id]: { last_name: '', first_name: '', middle_name: '' } }));
  };

  const deleteRow = async (id, isNew) => {
    if (isNew) { setRows(prev => prev.filter(r => r.id !== id)); return; }
    if (!window.confirm('Удалить актёра?')) return;
    await fetch(`/api/admin/actors/${id}`, { method: 'DELETE' });
    load();
  };

  const save = async () => {
    setSaving(true);
    try {
      for (const row of rows) {
        const e = edits[row.id];
        if (!e) continue;
        const body = JSON.stringify(e);
        if (row._new) {
          await fetch('/api/admin/actors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        } else {
          await fetch(`/api/admin/actors/${row.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body });
        }
      }
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TableWrap>
        <thead>
          <tr>
            <Th>Фамилия</Th>
            <Th>Имя</Th>
            <Th>Отчество</Th>
            <Th w="10%">Удалить</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const e = edits[row.id] || {};
            return (
              <tr key={row.id}>
                <Td><InlineInput value={e.last_name || ''} onChange={v => set(row.id, 'last_name', v)} /></Td>
                <Td><InlineInput value={e.first_name || ''} onChange={v => set(row.id, 'first_name', v)} /></Td>
                <Td><InlineInput value={e.middle_name || ''} onChange={v => set(row.id, 'middle_name', v)} /></Td>
                <Td>
                  <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: 13 }}
                    onClick={() => deleteRow(row.id, row._new)}>Удалить</button>
                </Td>
              </tr>
            );
          })}
          <tr>
            <td colSpan={4} style={{ padding: '10px 14px' }}>
              <button className="btn btn-outline" style={{ fontSize: 13 }} onClick={addRow}>+ Добавить актёра</button>
            </td>
          </tr>
        </tbody>
      </TableWrap>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" style={{ minWidth: 140 }} onClick={save} disabled={saving}>
          {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>
    </>
  );
}

// Основная страница
const TABS = ['Шоу', 'Показы', 'Актёры'];

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!user || user.role_id !== 1) navigate('/');
  }, [user]);

  if (!user || user.role_id !== 1) return null;

  return (
    <main>
      <div className="container" style={{ paddingTop: 40, paddingBottom: 60 }}>

        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--light)', marginBottom: 32 }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)} style={{
              padding: '10px 28px', background: 'transparent', border: 'none',
              borderBottom: tab === i ? '2px solid var(--dark)' : '2px solid transparent',
              marginBottom: -2, fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500,
              cursor: 'pointer', color: tab === i ? 'var(--dark)' : 'var(--dark-75)',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 0 && <ShowsTab />}
        {tab === 1 && <PerformancesTab />}
        {tab === 2 && <ActorsTab />}
      </div>
    </main>
  );
}