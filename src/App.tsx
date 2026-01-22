import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AdminDashboard } from './pages/AdminDashboard';
import { FlagInterface } from './pages/FlagInterface';
import { Simulator } from './pages/Simulator';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/flag" element={<FlagInterface />} />
          <Route path="/simulator" element={<Simulator />} />

          {/* Redirect root to admin for now, or keep the landing page */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
