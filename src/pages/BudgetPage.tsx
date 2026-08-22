import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { ArrowLeft, AlertTriangle, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { calculateTripFinancials } from '../lib/tripFinancials';
import { formatCurrency } from '../lib/tripFinancials';

const CATEGORY_COLORS = {
  transport: '#BC5E3E',
  accommodation: '#D1A153',
  activities: '#5F6B5F',
  meals: '#8A7B6A',
  other: '#C4B8A8',
};

const CATEGORY_LABELS: Record<string, string> = {
  transport: 'Transport',
  accommodation: 'Accommodation',
  activities: 'Activities',
  meals: 'Meals',
  other: 'Other',
};

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-ink-200 text-white px-3 py-2 rounded-lg shadow-warm-lg text-sm">
        <p className="font-semibold">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{formatCurrency(p.value, 'INR')}</p>
        ))}
      </div>
    );
  }
  return null;
}

function CustomPieTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const p = payload[0];
    return (
      <div className="bg-ink-200 text-white px-3 py-2 rounded-lg shadow-warm-lg text-sm">
        <p className="font-semibold">{CATEGORY_LABELS[p.name] ?? p.name}</p>
        <p>{formatCurrency(p.value, 'INR')}</p>
      </div>
    );
  }
  return null;
}

export function BudgetPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [financials, setFinancials] = useState<any>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data: tripData } = await supabase.from('trips').select('*').eq('id', id).single();
      if (tripData) {
        setTrip(tripData);
        try {
          const fin = await calculateTripFinancials(id);
          setFinancials(fin);

          // Daily spending data from stops
          const { data: stops } = await supabase
            .from('trip_stops')
            .select('*, destination:destinations(city_name)')
            .eq('trip_id', id)
            .order('stop_order');

          if (stops) {
            const daily = stops.map((s: any) => ({
              name: s.destination?.city_name ?? `Stop ${s.stop_order}`,
              transport: parseFloat(s.transport_cost) || 0,
              accommodation: parseFloat(s.accommodation_cost) || 0,
            }));
            setDailyData(daily);
          }
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-linen-100">
      <Loader2 size={28} className="animate-spin text-terracotta-500" />
    </div>;
  }

  if (!trip || !financials) {
    return <div className="flex-1 flex items-center justify-center bg-linen-100">
      <p className="text-sand-500">No data available.</p>
    </div>;
  }

  const budget = parseFloat(trip.estimated_budget) || 0;
  const spent = financials.grandTotal;
  const remaining = budget - spent;
  const pct = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = spent > budget;

  const pieData = Object.entries(financials.categoryBreakdown)
    .filter(([, v]) => (v as number) > 0)
    .map(([k, v]) => ({ name: k, value: v as number }));

  return (
    <div className="flex-1 overflow-auto bg-linen-100">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/trips/${id}/builder`)}
            className="flex items-center gap-1.5 text-sm text-sand-500 hover:text-terracotta-500 mb-3 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Builder
          </button>
          <h1 className="font-serif text-3xl font-bold text-ink-200">Budget Analytics</h1>
          <p className="text-sand-500 text-sm mt-1">{trip.title}</p>
        </div>

        {/* Over-budget alert */}
        {isOverBudget && (
          <div className="alert-budget mb-6 animate-slide-up" id="budget-over-limit-alert">
            <AlertTriangle size={20} className="text-dusty-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-dusty-700">Budget Exceeded</p>
              <p className="text-sm text-dusty-600 mt-0.5">
                You've exceeded your budget by{' '}
                <span className="font-bold">{formatCurrency(Math.abs(remaining), 'INR')}</span>.
                Review your stops and activities to identify savings opportunities.
              </p>
            </div>
          </div>
        )}

        {/* Top Stats */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            {
              label: 'Total Budget',
              value: formatCurrency(budget, 'INR'),
              icon: TrendingUp,
              color: 'text-sage-500',
              bg: 'bg-sage-50',
            },
            {
              label: 'Total Spent',
              value: formatCurrency(spent, 'INR'),
              icon: TrendingDown,
              color: isOverBudget ? 'text-dusty-500' : 'text-ochre-500',
              bg: isOverBudget ? 'bg-dusty-50' : 'bg-ochre-50',
            },
            {
              label: remaining >= 0 ? 'Remaining' : 'Over by',
              value: formatCurrency(Math.abs(remaining), 'INR'),
              icon: remaining >= 0 ? TrendingUp : AlertTriangle,
              color: remaining >= 0 ? 'text-sage-600' : 'text-dusty-500',
              bg: remaining >= 0 ? 'bg-sage-50' : 'bg-dusty-50',
            },
          ].map((stat) => (
            <div key={stat.label} className="card">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-4 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <p className="text-xs text-sand-500 uppercase tracking-wider font-semibold mb-1">{stat.label}</p>
              <p className="font-serif text-2xl font-bold text-ink-200">{stat.value}</p>
              <div className="mt-3 progress-track">
                <div
                  className={pct >= 100 ? 'progress-fill-danger' : pct >= 80 ? 'h-full bg-ochre-400 rounded-full' : 'progress-fill-safe'}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <p className="text-xs text-sand-400 mt-1">{Math.round(pct)}% of budget used</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Donut Chart */}
          <div className="card">
            <h3 className="font-serif text-lg font-semibold text-ink-200 mb-5">Spending Breakdown</h3>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-sand-400 text-sm">
                No expenses recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] ?? '#C4B8A8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] ?? '#C4B8A8' }}
                  />
                  <span className="text-xs text-sand-500 capitalize">{CATEGORY_LABELS[entry.name] ?? entry.name}</span>
                  <span className="text-xs font-semibold text-ink-50 ml-auto">{formatCurrency(entry.value, 'INR')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="card">
            <h3 className="font-serif text-lg font-semibold text-ink-200 mb-5">Spending by Stop</h3>
            {dailyData.length === 0 ? (
              <div className="flex items-center justify-center h-56 text-sand-400 text-sm">
                No stops recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={256}>
                <BarChart data={dailyData} barSize={16}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8A7B6A' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#8A7B6A' }} width={60}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="transport" name="Transport" fill="#BC5E3E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accommodation" name="Accommodation" fill="#D1A153" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Detail Table */}
        <div className="card">
          <h3 className="font-serif text-lg font-semibold text-ink-200 mb-5">Category Detail</h3>
          <div className="space-y-3">
            {Object.entries(financials.categoryBreakdown).map(([cat, amount]) => {
              const amt = amount as number;
              const catPct = spent > 0 ? (amt / spent) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? '#C4B8A8' }}
                      />
                      <span className="text-sm font-medium text-ink-50 capitalize">{CATEGORY_LABELS[cat] ?? cat}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-sand-400">{Math.round(catPct)}%</span>
                      <span className="text-sm font-semibold text-ink-200">{formatCurrency(amt, 'INR')}</span>
                    </div>
                  </div>
                  <div className="progress-track">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${catPct}%`,
                        background: CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? '#C4B8A8',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
