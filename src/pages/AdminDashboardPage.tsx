import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Users, MapPin, Plane, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../lib/tripFinancials';

interface Stats {
  totalUsers: number;
  totalTrips: number;
  totalDestinations: number;
}

interface PopularDest {
  name: string;
  count: number;
}

interface UserTable {
  id: string;
  full_name: string;
  created_at: string;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalTrips: 0, totalDestinations: 0 });
  const [popularDests, setPopularDests] = useState<PopularDest[]>([]);
  const [recentUsers, setRecentUsers] = useState<UserTable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      // Basic Counts
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: tripCount } = await supabase.from('trips').select('*', { count: 'exact', head: true });
      const { count: destCount } = await supabase.from('destinations').select('*', { count: 'exact', head: true });
      
      setStats({
        totalUsers: userCount || 0,
        totalTrips: tripCount || 0,
        totalDestinations: destCount || 0,
      });

      // Recent Users
      const { data: users } = await supabase.from('profiles').select('id, full_name, created_at').order('created_at', { ascending: false }).limit(5);
      setRecentUsers(users || []);

      // Popular Destinations
      const { data: stops } = await supabase.from('trip_stops').select('destination:destinations(city_name)');
      
      const counts: Record<string, number> = {};
      stops?.forEach(s => {
        const name = (s.destination as any)?.city_name;
        if (name) counts[name] = (counts[name] || 0) + 1;
      });
      
      const destArray = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setPopularDests(destArray);
      setLoading(false);
    }
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-linen-100">
        <Loader2 size={28} className="animate-spin text-terracotta-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-linen-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-ink-200">Admin Dashboard</h1>
          <p className="text-sand-500">Platform analytics and overview</p>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-terracotta-500' },
            { label: 'Trips Created', value: stats.totalTrips, icon: Plane, color: 'text-sage-500' },
            { label: 'Destinations', value: stats.totalDestinations, icon: MapPin, color: 'text-dusty-500' },
          ].map((k, i) => (
            <div key={i} className="card p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-sand-200 flex items-center justify-center ${k.color}`}>
                <k.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-semibold text-sand-500">{k.label}</p>
                <p className="font-serif text-2xl font-bold text-ink-200">{k.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Charts */}
          <div className="card p-6">
            <h2 className="font-serif text-lg font-semibold text-ink-200 mb-6">Popular Destinations</h2>
            <div className="h-[300px]">
              {popularDests.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularDests}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#8C8987', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8C8987', fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#F2EFEB' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {popularDests.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#BC5E3E' : '#D1A153'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sand-400">Not enough data to display chart</div>
              )}
            </div>
          </div>

          {/* User Table */}
          <div className="card p-6">
            <h2 className="font-serif text-lg font-semibold text-ink-200 mb-4">Recent Users</h2>
            <div className="space-y-4">
              {recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-linen-100 rounded-lg border border-sand-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-sand-300 flex items-center justify-center font-bold text-ink-50">
                      {u.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-ink-200">{u.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-sand-500">ID: {u.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-sand-500">Joined</p>
                    <p className="font-semibold text-sm text-ink-200">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && <p className="text-sand-500 text-center py-4">No users found.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
