import type { ReactNode } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F7F7FA] flex w-full">
      <Sidebar />
      <main className="flex-1 min-w-0 md:ml-[270px] min-h-screen flex flex-col">
        <Header />
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 pb-8 w-full flex-1 flex flex-col">
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
