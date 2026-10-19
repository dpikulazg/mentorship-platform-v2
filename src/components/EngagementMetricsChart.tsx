import React, { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { UserProfile, AppSettings } from '../types';

interface EngagementMetricsChartProps {
  users: UserProfile[];
  settings: AppSettings;
}

export function EngagementMetricsChart({ users, settings }: EngagementMetricsChartProps) {
  const chartData = useMemo(() => {
    // Process users to get registration counts and revenue by date
    const counts: Record<string, { users: number, revenue: number }> = {};
    
    // Get date range (last 14 days)
    const dates: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
      counts[dateStr] = { users: 0, revenue: 0 };
    }

    users.forEach(user => {
      const dateStr = user.createdAt.split('T')[0];
      if (counts[dateStr] !== undefined) {
        counts[dateStr].users++;
        if (user.plan === 'pro' || user.plan === 'mentorship') {
          counts[dateStr].revenue += settings.subscriptionPrice;
        }
      }
    });

    // We can also make it cumulative
    let cumUsers = 0;
    let cumRevenue = 0;

    return dates.map(date => {
      cumUsers += counts[date].users;
      cumRevenue += counts[date].revenue;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newUsers: counts[date].users,
        dailyRevenue: counts[date].revenue,
        totalUsers: cumUsers,
        totalRevenue: cumRevenue
      };
    });
  }, [users, settings]);

  return (
    <div className="h-[350px] w-full mt-6 bg-[#050507] border border-primary/20 p-4 rounded-[16px] relative overflow-hidden group shadow-[0_0_25px_rgba(175,70,255,0.05)]">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(circle_at_center,var(--primary)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      <div className="flex items-center justify-between mb-6 pl-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Engagement & Monetization</h3>
            <p className="text-[11px] text-[#bfb9ca] uppercase tracking-wider font-mono mt-0.5">L-14 Daily Metrics</p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-primary/50 uppercase tracking-widest border border-primary/20 bg-primary/5 px-2 py-1 rounded">
          Status: Live
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#AF46FF" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#AF46FF" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(175, 70, 255, 0.1)" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="rgba(175, 70, 255, 0.4)" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#bfb9ca', fontFamily: 'Inter, sans-serif' }}
            dy={10}
          />
          <YAxis 
            yAxisId="left"
            stroke="rgba(175, 70, 255, 0.4)" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#bfb9ca', fontFamily: 'Inter, sans-serif' }}
            tickFormatter={(val) => Math.floor(val).toString()}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="rgba(16, 185, 129, 0.4)" 
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#bfb9ca', fontFamily: 'Inter, sans-serif' }}
            tickFormatter={(val) => `${settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : ''}${val}`}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-[#05050a]/95 border border-[#2d2146] p-4 rounded-xl shadow-xl relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#AF46FF] to-[#10B981]" />
                    <div className="font-bold text-white mb-2 pb-2 border-b border-white/10">{label}</div>
                    <div className="space-y-3 pt-1">
                      {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex flex-col gap-1">
                          <div className="text-[11px] text-[#bfb9ca] uppercase tracking-wider">{entry.name}</div>
                          <div className="font-mono text-lg text-white">
                            {entry.dataKey === 'dailyRevenue' 
                              ? `${settings.currency} ${entry.value.toLocaleString()}`
                              : entry.value.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '12px', fontFamily: 'Inter, sans-serif', color: '#bfb9ca' }}
          />
          <Area 
            yAxisId="left"
            type="monotone" 
            dataKey="newUsers" 
            name="New Users"
            stroke="#AF46FF" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorUsers)" 
            animationDuration={1500}
          />
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="dailyRevenue" 
            name="Daily Revenue"
            stroke="#10B981" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorRevenue)" 
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
