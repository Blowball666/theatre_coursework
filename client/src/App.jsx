import CashierPage from './pages/CashierPage';
import CashierShowPage from './pages/CashierShowPage';
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import HomePage from './pages/HomePage';
import ShowPage from './pages/ShowPage';
import AccountPage from './pages/AccountPage';
import { ContactsPage, HallsPage } from './pages/OtherPages';
import './styles/global.css';
import AdminPage from './pages/AdminPage';

function App() {
  const [authMode, setAuthMode] = useState(null); // 'login' | 'register' | null

  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh' }}>
          <Navbar onAuthClick={setAuthMode} />
          <div style={{ flex:1 }}>
            <Routes>
              <Route path="/"        element={<HomePage />} />
              <Route path="/show/:id" element={<ShowPage onAuthClick={setAuthMode} />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/halls"   element={<HallsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/cashier" element={<CashierPage />} />
              <Route path="/cashier/show/:id" element={<CashierShowPage />} />
            </Routes>
          </div>
          <Footer />
        </div>

        {authMode && (
          <AuthModal
            mode={authMode}
            onClose={() => setAuthMode(null)}
            onSwitch={setAuthMode}
          />
        )}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
