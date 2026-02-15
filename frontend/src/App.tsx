import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Canvas } from '@/components/Canvas/Canvas.tsx';
import { Toolbar } from '@/components/Toolbar/Toolbar.tsx';
import { PropertiesPanel } from '@/components/PropertiesPanel/PropertiesPanel.tsx';
import { ActionPanel } from '@/components/ActionPanel/ActionPanel.tsx';
import { TextActionPanel } from '@/components/TextActionPanel/TextActionPanel.tsx';
import './styles/global.css';

function EditorPage() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--color-bg)', color: 'var(--color-text)', position: 'relative' }}>
      <Toolbar />
      <PropertiesPanel />
      <TextActionPanel />
      <ActionPanel />
      <Canvas />
    </div>
  );
}

function DashboardPage() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--color-bg)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Dashboard (Phase 10)</p>
    </div>
  );
}

function LoginPage() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--color-bg)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Login (Phase 9)</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/draw/:id" element={<EditorPage />} />
        <Route path="/draw" element={<EditorPage />} />
        <Route path="/" element={<Navigate to="/draw" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
