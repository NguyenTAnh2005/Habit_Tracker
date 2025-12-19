import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashBoardPage';
import MainLayout from './layout/MainLayout'; // Import Layout

// Component bảo vệ (giữ nguyên logic cũ)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Trang Login: KHÔNG dùng MainLayout (Full màn hình) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Các trang bên trong: DÙNG MainLayout (Có Sidebar) */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </PrivateRoute>
          } 
        />
        
        {/* Sau này thêm trang Habits, Stats thì cũng bọc y chang vậy */}
        {/* <Route path="/habits" element={<PrivateRoute><MainLayout><HabitsPage /></MainLayout></PrivateRoute>} /> */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;