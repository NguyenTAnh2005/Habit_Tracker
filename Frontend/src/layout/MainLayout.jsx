import { useState } from 'react';
import { Menu } from 'lucide-react'; // Icon 3 gạch
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar truyền props điều khiển */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full w-full relative transition-all duration-300">
        
        {/* 👇 HEADER MOBILE: Chỉ hiện nút Menu trên màn hình nhỏ */}
        <div className="md:hidden flex items-center justify-between bg-white border-b px-4 py-3 shrink-0">
            <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
                <Menu size={24} />
            </button>
            <span className="font-bold text-gray-700">HabitTracker</span>
            <div className="w-8"></div> {/* Spacer cho cân đối */}
        </div>

        {/* Nội dung chính (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth w-full">
          <div className="max-w-7xl mx-auto"> {/* Giới hạn chiều rộng nội dung cho đẹp trên màn to */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;