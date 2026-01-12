import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, Label
} from 'recharts';
import { Calendar, Filter, PieChart as PieChartIcon, Activity } from 'lucide-react';
import habitApi from '../api/habitAPI';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css';

const StatsPage = () => {
  const [logs, setLogs] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [loading, setLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);

  useEffect(() => {
    const fetchAllStats = async () => {
      setLoading(true);
      try {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1; 

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); 

        const toLocalISO = (d) => {
            const offset = d.getTimezoneOffset() * 60000;
            return (new Date(d - offset)).toISOString().slice(0, 10);
        };

        const [historyRes, heatmapRes] = await Promise.all([
            habitApi.getHistory({
                from_date: toLocalISO(startDate),
                to_date: toLocalISO(endDate),
                limit: 1000 
            }),
            habitApi.getHeatmap(year, month)
        ]);
        
        setLogs(historyRes);
        setHeatmapData(heatmapRes);
        processChartData(historyRes, startDate, endDate.getDate());

      } catch (error) {
        console.error("Lỗi load stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllStats();
  }, [selectedDate]);

  const processChartData = (data, startDate, daysInMonth) => {
    const statsMap = {};
    // Khởi tạo map cho từng ngày trong tháng
    for (let i = 0; i < daysInMonth; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const offset = d.getTimezoneOffset() * 60000;
      const dateStr = (new Date(d - offset)).toISOString().slice(0, 10);
      const displayDate = `${d.getDate()}/${d.getMonth() + 1}`;
      statsMap[dateStr] = { date: displayDate, completed: 0, partial: 0 };
    }

    let countCompleted = 0, countPartial = 0, countSkipped = 0, countFailed = 0;

    // Duyệt qua dữ liệu từ API để đếm
    data.forEach(log => {
      const dateKey = log.record_date;
      
      // Đếm tổng quát cho biểu đồ tròn (Pie/Donut)
      if (log.status === 'COMPLETED') countCompleted++;
      else if (log.status === 'PARTIAL') countPartial++;
      else if (log.status === 'SKIPPED') countSkipped++;
      else countFailed++;

      // Đếm chi tiết theo ngày cho biểu đồ cột (Bar Chart)
      if (statsMap[dateKey]) {
        if (log.status === 'COMPLETED') statsMap[dateKey].completed += 1;
        if (log.status === 'PARTIAL') statsMap[dateKey].partial += 1;
      }
    });

    // =========================================================
    // 👇 ĐÂY LÀ CHỖ MỚI: TÍNH TỔNG VÀ LƯU VÀO STATE
    // =========================================================
    const total = countCompleted + countPartial + countSkipped + countFailed;
    setTotalLogs(total); 
    // =========================================================

    setChartData(Object.values(statsMap));

    const pieSource = [
      { name: 'Hoàn thành', value: countCompleted },
      { name: 'Một phần', value: countPartial },
      { name: 'Bỏ qua', value: countSkipped },
      { name: 'Thất bại', value: countFailed }
    ];
    setPieData(pieSource.filter(item => item.value > 0));
  };

  const handleMonthChange = (e) => {
    if (e.target.value) {
        const [y, m] = e.target.value.split('-');
        setSelectedDate(new Date(parseInt(y), parseInt(m) - 1, 1));
    }
  };

    // Hàm để hiển thị nhãn % bên ngoài biểu đồ
  const renderCustomizedLabel = ({ name, percent }) => {
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  const heatmapStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const heatmapEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
  const currentMonthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`;

  if (loading && logs.length === 0 && heatmapData.length === 0) return <div className="p-10 text-center">Đang tải dữ liệu... ⏳</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER & FILTER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Thống kê hoạt động</h1>
          <p className="text-sm text-gray-500">Tháng {selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm border border-gray-200 w-fit">
            <Calendar size={18} className="text-gray-500"/>
            <input 
                type="month" 
                className="text-sm font-bold text-gray-700 outline-none bg-transparent cursor-pointer"
                value={currentMonthStr}
                onChange={handleMonthChange}
            />
        </div>
      </div>

      {/* HEATMAP - Fix width: max-w-2xl và mx-auto */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-green-600"/> Bản đồ năng suất
        </h3>

        <div className="w-full max-w-xs mx-auto"> 
            <CalendarHeatmap
                startDate={heatmapStart}
                endDate={heatmapEnd}
                values={heatmapData}
                classForValue={(value) => {
                    if (!value) return 'color-scale-0'; 
                    return `color-scale-${value.level}`; 
                }}
                tooltipDataAttrs={value => {
                    if (!value || !value.date) return null;
                    return {
                        'data-tooltip-id': 'heatmap-tooltip',
                        'data-tooltip-content': `${new Date(value.date).toLocaleDateString('vi-VN')}: ${value.rate}%`,
                    };
                }}
                showWeekdayLabels={true}
                gutterSize={3} 
            />
            <Tooltip id="heatmap-tooltip" style={{ backgroundColor: "#1F2937", borderRadius: "8px", fontSize: "12px", zIndex: 50 }} />
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500"/> Tần suất theo ngày
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{fontSize: 10}} interval={2} /> 
                <YAxis allowDecimals={false} width={30} tick={{fontSize: 10}}/>
                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle"/>
                <Bar name="Hoàn thành" dataKey="completed" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} barSize={20} />
                <Bar name="Một phần" dataKey="partial" stackId="a" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Filter size={20} className="text-orange-500"/> Tỉ lệ trong tháng
          </h3>
          <div className="h-80 relative"> {/* Tăng chiều cao lên một chút để không bị đè nhãn */}
            {pieData.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70} // Tăng lỗ ở giữa
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={renderCustomizedLabel} // Hiển thị % bên ngoài
                    labelLine={true} // Vẽ đường dẫn từ biểu đồ ra chữ
                  >
                    {pieData.map((entry, index) => {
                      let color = '#9CA3AF';
                      if (entry.name === 'Hoàn thành') color = '#10B981';
                      else if (entry.name === 'Một phần') color = '#3B82F6';
                      else if (entry.name === 'Bỏ qua') color = '#F59E0B';
                      else if (entry.name === 'Thất bại') color = '#EF4444';
                      return <Cell key={`cell-${index}`} fill={color} stroke="none" />;
                    })}
                    
                    {/* 👇 HIỂN THỊ SỐ LƯỢNG Ở TRUNG TÂM */}
                    <Label 
                      value={`${totalLogs}`} 
                      position="center" 
                      className="text-2xl font-bold fill-gray-800"
                      dy={-10} // Đẩy lên trên một chút
                    />
                    <Label 
                      value="Nhật ký" 
                      position="center" 
                      className="text-xs fill-gray-400 font-medium"
                      dy={15} // Đẩy xuống dưới một chút
                    />
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* HISTORY TABLE - Scrollable on mobile */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Nhật ký chi tiết</h3>
        </div>
        <div className="overflow-x-auto overflow-y-scroll max-h-96">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-4 py-3 md:px-6 font-medium">Ngày</th>
                <th className="px-4 py-3 md:px-6 font-medium">Thói quen</th>
                <th className="px-4 py-3 md:px-6 font-medium">Kết quả</th>
                <th className="px-4 py-3 md:px-6 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-400">Không có hoạt động nào.</td></tr>
              ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 md:px-6 text-gray-600">{new Date(log.record_date).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3 md:px-6 font-medium text-gray-800">{log.habit_name || "Thói quen cũ"}</td>
                    <td className="px-4 py-3 md:px-6 text-gray-600">
                      {
                        log.unit !== null
                          ? `${log.value} ${log.unit}`
                          : {
                              COMPLETED: 'Hoàn thành',
                              SKIPPED: 'Bỏ qua',
                              FAILED: 'Thất bại'
                            }[log.status] || 'Không xác định'
                      }
                    </td>
                    <td className="px-4 py-3 md:px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border
                        ${log.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' : 
                          log.status === 'PARTIAL' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          log.status === 'SKIPPED' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                          'bg-red-50 text-red-700 border-red-200'}`}>
                          {log.status === 'PARTIAL' && <PieChartIcon size={12}/>}
                          {log.status}
                        </span>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .react-calendar-heatmap text { font-size: 10px; fill: #9CA3AF; }
        .react-calendar-heatmap .color-scale-0 { fill: #E5E7EB; rx: 3px; } 
        .react-calendar-heatmap .color-scale-1 { fill: #bbf7d0; rx: 3px; }
        .react-calendar-heatmap .color-scale-2 { fill: #4ade80; rx: 3px; }
        .react-calendar-heatmap .color-scale-3 { fill: #16a34a; rx: 3px; }
        .react-calendar-heatmap .color-scale-4 { fill: #14532d; rx: 3px; }
        .react-calendar-heatmap { width: 100%; height: auto; }
      `}</style>
    </div>
  );
};

export default StatsPage;