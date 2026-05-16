import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OVERLAY = {
  position: 'fixed', inset: 0,
  background: 'rgba(7,3,25,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
};

const BOX = {
  background: '#F1F1F1', borderRadius: 16,
  padding: '48px 40px', width: '100%', maxWidth: 520,
};

export default function AuthModal({ mode, onClose, onSwitch }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [fio, setFio]           = useState('');
  const [dob, setDob]           = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const parseFio = (str) => {
    const p = str.trim().split(/\s+/);
    return { last_name: p[0]||'', first_name: p[1]||'', middle_name: p.slice(2).join(' ')||'' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
        navigate('/account');
      } else {
        const { last_name, first_name, middle_name } = parseFio(fio);
        await register({ last_name, first_name, middle_name, email, password, date_of_birth: dob || undefined });
        onSwitch('login');
      }
    } catch (err) {
      setError(err.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={OVERLAY} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={BOX}>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 500,
          textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 32,
        }}>
          {mode === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <>
              <input className="field" style={{ borderRadius: 40 }} placeholder="ФИО"
                value={fio} onChange={e => setFio(e.target.value)} required />
              <input className="field" style={{ borderRadius: 40 }} placeholder="Дата рождения"
                type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </>
          )}
          <input className="field" style={{ borderRadius: 40 }} placeholder="email"
            type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="field" style={{ borderRadius: 40 }} placeholder="пароль"
            type="password" value={password} onChange={e => setPassword(e.target.value)} required />

          {error && <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{error}</p>}

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--dark-75)', margin: '4px 0' }}>
            {mode === 'login'
              ? <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onSwitch('register')}>Нет аккаунта? Зарегистрироваться</span>
              : <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onSwitch('login')}>У меня уже есть аккаунт</span>
            }
          </p>

          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? '...' : mode === 'login' ? 'Войти' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
