import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import BusinessPanel from '../components/abavie/BusinessPanel';
import './AbTalk.css';
import './BusinessPage.css';

export default function BusinessPage() {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  return (
    <div className="abv-business-page" data-mode={darkMode ? 'dark' : 'light'}>
      <div className="abv-business-page-header">
        <button className="abv-business-page-back" onClick={() => navigate(-1)}>
          ← Retour
        </button>
        <h1>💼 Mode Business</h1>
      </div>
      <div className="abv-business-page-body">
        <BusinessPanel />
      </div>
    </div>
  );
}
