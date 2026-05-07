import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background neural-grid">
      <Header />
      <main className="pt-20 pb-24 px-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
