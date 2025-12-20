import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashBoardPage';
import MainLayout from './layout/MainLayout'; 
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import StatsPage from './pages/StatsPage';
import AdminRoute from './components/AdminRoute';
import AdminPage from './pages/AdminPage';
import HabitsPage from './pages/HabitPage';
import ForgotPasswordPage from './pages/ForgotPassWordPage';

// Component bảo vệ (giữ nguyên logic cũ)
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* === CÁC TRANG PUBLIC (KHÔNG CẦN LOGIN) === */}
        
        {/* Trang Login: Full màn hình */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />


        {/* === CÁC TRANG PRIVATE (CẦN LOGIN & CÓ SIDEBAR) === */}
        <Route path="/" element={ <PrivateRoute> <MainLayout> <DashboardPage /> </MainLayout> </PrivateRoute>}/>
        <Route path="/profile" element={ <PrivateRoute><MainLayout><ProfilePage /></MainLayout></PrivateRoute>}/>
        <Route path="/stats" element={<PrivateRoute><MainLayout><StatsPage /></MainLayout></PrivateRoute>} 
        />
        <Route path="/habits" element={<PrivateRoute><MainLayout><HabitsPage /></MainLayout></PrivateRoute>} />
        <Route element={<AdminRoute />}> {/* Bọc bằng AdminRoute */}
             <Route 
                path="/admin/manager" 
                element={
                    <MainLayout> {/* Vẫn dùng MainLayout để có Sidebar */}
                        <AdminPage />
                    </MainLayout>
                } 
             />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;