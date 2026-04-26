import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ParticleBackground from '../ui/ParticleBackground';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-surface">
      <ParticleBackground />
      <Navbar />
      <Sidebar />
      <main className="relative z-10 ml-72 pt-14 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
