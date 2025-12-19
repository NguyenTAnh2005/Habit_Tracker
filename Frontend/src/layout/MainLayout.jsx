import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Cột bên trái: Sidebar cố định */}
      <Sidebar />

      {/* Cột bên phải: Nội dung thay đổi (Scroll được) */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;