import { useState } from 'react';
import { Users, Layers, Quote, ListChecks, ShieldCheck } from 'lucide-react';

// Import các component con
import UsersManager from '../components/admin/UsersManager';
import RolesManager from '../components/admin/RolesManager';
import CategoriesManager from '../components/admin/CategoriesManager';
import QuotesManager from '../components/admin/QuotesManager';
import HabitsManager from '../components/admin/HabitManger';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    // pb-20 để tránh bị che bởi footer/navigation của điện thoại nếu có
    <div className="min-h-screen bg-gray-50 pb-20"> 
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hệ Thống Quản Trị</h1>
        <p className="text-gray-500 text-sm md:text-base">Quản lý người dùng, phân quyền và nội dung hệ thống</p>
      </div>

      {/* Navigation Tabs - Scroll ngang mượt mà */}
      <div className="flex overflow-x-auto gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100 mb-6 no-scrollbar">
        <TabButton id="users" icon={Users} label="Người dùng" active={activeTab} onClick={setActiveTab} />
        <TabButton id="roles" icon={ShieldCheck} label="Phân quyền" active={activeTab} onClick={setActiveTab} />
        <TabButton id="categories" icon={Layers} label="Danh mục" active={activeTab} onClick={setActiveTab} />
        <TabButton id="quotes" icon={Quote} label="Câu nói" active={activeTab} onClick={setActiveTab} />
        <TabButton id="habits" icon={ListChecks} label="Thói quen" active={activeTab} onClick={setActiveTab} />
      </div>

      {/* Content Area - Padding responsive */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 min-h-[500px]">
        {activeTab === 'users' && <UsersManager />}
        {activeTab === 'roles' && <RolesManager />}
        {activeTab === 'categories' && <CategoriesManager />}
        {activeTab === 'quotes' && <QuotesManager />}
        {activeTab === 'habits' && <HabitsManager />}
      </div>
    </div>
  );
};

const TabButton = ({ id, icon: Icon, label, active, onClick }) => (
  <button 
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap shrink-0
      ${active === id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'}`}
  >
    <Icon size={18} /> {label}
  </button>
);

export default AdminPage;