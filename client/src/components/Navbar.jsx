import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onAuthClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goAfisha = (e) => {
    e.preventDefault();
    if (window.location.pathname === '/') {
      document.getElementById('afisha')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#afisha');
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__logo">Театр</Link>
        <ul className="navbar__links">
           <li><a href="/#afisha" onClick={goAfisha}>Афиша</a></li>
           <li><NavLink to="/contacts">Контакты</NavLink></li>
           <li><NavLink to="/halls">Планы залов</NavLink></li>
           {user?.role_id === 1 && <li><NavLink to="/admin">Админ</NavLink></li>}
           {user?.role_id === 2 && <li><NavLink to="/cashier">Проданные билеты</NavLink></li>}
           <li>
             {user
               ? <NavLink to="/account">Аккаунт</NavLink>
               : <a href="#" onClick={e => { e.preventDefault(); onAuthClick('login'); }}>Аккаунт</a>
             }
           </li>           
          </ul>
      </div>
    </nav>
  );
}
