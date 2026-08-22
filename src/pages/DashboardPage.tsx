import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, MapPin, Calendar, TrendingUp, Globe, Star, ChevronRight,
  Plane, Wallet, Clock, ArrowUpRight,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, getCostIndexSymbol } from '../lib/tripFinancials';
import { formatDate, formatDateShort, getDaysBetween, getDestinationImage } from '../lib/utils';

interface Trip {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  estimated_budget: number;
  currency: string;
  cover_image_url: string | null;
}

interface Destination {
  id: string;
  city_name: string;
  country: string;
  description: string | null;
  image_url: string | null;
  cost_index: number | null;
  popularity_score: number | null;
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-32 ${className}`} />;
}

export function DashboardPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpending, setTotalSpending] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const [tripsRes, destRes] = await Promise.all([
        supabase.from('trips').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('destinations').select('*').order('popularity_score', { ascending: false }).limit(6),
      ]);

      if (tripsRes.data) setTrips(tripsRes.data);
      if (destRes.data) setDestinations(destRes.data);

      // Calculate total spending across all trips
      if (tripsRes.data && tripsRes.data.length > 0) {
        const tripIds = tripsRes.data.map((t: Trip) => t.id);
        const { data: expenses } = await supabase
          .from('expenses')
          .select('amount')
          .in('trip_id', tripIds);
        if (expenses) {
          setTotalSpending(expenses.reduce((s: number, e: any) => s + parseFloat(e.amount), 0));
        }
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const upcomingTrips = trips.filter(t => new Date(t.start_date) >= new Date()).slice(0, 1);
  const nextTrip = upcomingTrips[0];
  const totalBudget = trips.reduce((s, t) => s + (t.estimated_budget ?? 0), 0);
  const budgetPct = totalBudget > 0 ? Math.min(100, (totalSpending / totalBudget) * 100) : 0;

  const countries = [...new Set(trips.map(() => ''))].length; // placeholder until we join destinations

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="flex-1 overflow-auto bg-linen-100">
      <div className="max-w-7xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="section-label mb-2">{greeting}</p>
            <h1 className="font-serif text-4xl font-bold text-ink-200">
              {greeting}, {profile?.full_name?.split(' ')[0] ?? 'Traveller'} 👋
            </h1>
            <p className="text-sand-500 text-sm mt-2">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => navigate('/trips/new')}
            id="dashboard-new-trip-btn"
            className="btn-primary"
          >
            <Plus size={16} />
            Plan New Trip
          </button>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-5 mb-10">

          {/* Box A: Stats — col 1-4 */}
          <div className="col-span-12 lg:col-span-4 grid grid-cols-2 gap-4">
            {[
              { label: 'Planned Trips', value: trips.length, icon: MapPin, color: 'text-terracotta-500' },
              { label: 'Upcoming', value: upcomingTrips.length, icon: Plane, color: 'text-sage-500' },
              { label: 'Total Budget', value: formatCurrency(totalBudget, 'INR'), icon: Wallet, color: 'text-ochre-500', small: true },
              { label: 'Total Spent', value: formatCurrency(totalSpending, 'INR'), icon: TrendingUp, color: 'text-dusty-500', small: true },
            ].map((stat) => (
              <div key={stat.label} className="card flex flex-col gap-3 hover-scale cursor-default">
                <div className={`w-9 h-9 rounded-lg bg-linen-200 flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                <div>
                  <p className={`font-serif ${stat.small ? 'text-xl' : 'text-2xl'} font-bold text-ink-200`}>
                    {loading ? '—' : stat.value}
                  </p>
                  <p className="text-xs text-sand-500 font-medium mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Box B: Upcoming Trip — col 5-12 */}
          <div className="col-span-12 lg:col-span-8">
            {loading ? (
              <SkeletonCard className="h-56" />
            ) : nextTrip ? (
              <div
                className="relative rounded-xl overflow-hidden h-56 cursor-pointer group"
                onClick={() => navigate(`/trips/${nextTrip.id}/builder`)}
                id="dashboard-upcoming-trip-card"
              >
                <img
                  src={getDestinationImage('', nextTrip.cover_image_url)}
                  alt={nextTrip.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-200/90 via-ink-200/40 to-transparent" />
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <span className="badge-terracotta">Upcoming Trip</span>
                    <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-white mb-1">{nextTrip.title}</h2>
                    <p className="text-white/70 text-sm flex items-center gap-2 mb-3">
                      <Calendar size={13} />
                      {formatDateShort(nextTrip.start_date)} → {formatDate(nextTrip.end_date)}
                      <span className="text-white/40">·</span>
                      <Clock size={13} />
                      {getDaysBetween(nextTrip.start_date, nextTrip.end_date)} days
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60 text-xs">Trip progress</span>
                        <span className="text-white text-xs font-semibold">
                          {Math.min(100, Math.round(((Date.now() - new Date(nextTrip.start_date).getTime()) / 
                            (new Date(nextTrip.end_date).getTime() - new Date(nextTrip.start_date).getTime())) * 100))}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${Math.max(0, Math.min(100, Math.round(((Date.now() - new Date(nextTrip.start_date).getTime()) /
                              (new Date(nextTrip.end_date).getTime() - new Date(nextTrip.start_date).getTime())) * 100)))}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="card h-56 flex flex-col items-center justify-center text-center cursor-pointer hover:border-terracotta-200 hover:bg-terracotta-50/30 transition-all duration-200"
                onClick={() => navigate('/trips/new')}
                id="dashboard-no-trips-cta"
              >
                <div className="w-14 h-14 rounded-full bg-terracotta-50 flex items-center justify-center mb-4">
                  <Plane size={24} className="text-terracotta-400" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-ink-200 mb-2">No upcoming trips</h3>
                <p className="text-sand-500 text-sm mb-4 max-w-xs">
                  Your next adventure awaits. Start planning your perfect journey.
                </p>
                <span className="btn-primary text-xs">
                  <Plus size={14} /> Plan Your First Trip
                </span>
              </div>
            )}
          </div>

          {/* Box C: Budget Watch */}
          <div className="col-span-12 lg:col-span-5 card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="section-label">Budget Overview</p>
                <h3 className="font-serif text-xl font-semibold text-ink-200 mt-1">Portfolio Watch</h3>
              </div>
              <Wallet className="text-sand-400" size={20} />
            </div>
            <div className="space-y-4">
              <div className="flex items-end gap-3">
                <div>
                  <p className="text-xs text-sand-500 mb-1">Total Allocated</p>
                  <p className="font-serif text-3xl font-bold text-ink-200">{formatCurrency(totalBudget, 'INR')}</p>
                </div>
                <div className="pb-1">
                  <span className={`badge ${budgetPct >= 100 ? 'badge-dusty' : budgetPct >= 80 ? 'badge-ochre' : 'badge-sage'}`}>
                    {budgetPct >= 100 ? '⚠️ Over budget' : budgetPct >= 80 ? 'Near limit' : 'On track'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-sand-500">Spent: {formatCurrency(totalSpending, 'INR')}</span>
                  <span className="font-semibold text-ink-50">{Math.round(budgetPct)}% used</span>
                </div>
                <div className="progress-track">
                  <div
                    className={budgetPct >= 100 ? 'progress-fill-danger' : budgetPct >= 80 ? 'h-full bg-ochre-400 rounded-full transition-all duration-500' : 'progress-fill-safe'}
                    style={{ width: `${Math.min(100, budgetPct)}%` }}
                  />
                </div>
                <p className="text-xs text-sand-400">
                  Remaining: <span className="font-semibold text-ink-50">{formatCurrency(Math.max(0, totalBudget - totalSpending), 'INR')}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Box D: Recent Trips List */}
          <div className="col-span-12 lg:col-span-7 card">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="section-label">Your Journeys</p>
                <h3 className="font-serif text-xl font-semibold text-ink-200 mt-1">Recent Trips</h3>
              </div>
              <button onClick={() => navigate('/trips')} className="btn-ghost text-xs gap-1.5">
                View all <ChevronRight size={14} />
              </button>
            </div>
            {loading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
            ) : trips.length === 0 ? (
              <div className="text-center py-8 text-sand-500">
                <Globe size={32} className="mx-auto mb-3 text-sand-300" />
                <p className="text-sm">No trips yet — start exploring!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {trips.slice(0, 4).map((trip) => (
                  <button
                    key={trip.id}
                    id={`dashboard-trip-row-${trip.id}`}
                    onClick={() => navigate(`/trips/${trip.id}/builder`)}
                    className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-linen-200 transition-all duration-150 text-left group"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={getDestinationImage('', trip.cover_image_url)}
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink-200 truncate">{trip.title}</p>
                      <p className="text-xs text-sand-500 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={11} />
                        {formatDateShort(trip.start_date)} – {formatDateShort(trip.end_date)}
                        <span className="text-sand-300">·</span>
                        {getDaysBetween(trip.start_date, trip.end_date)}d
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-ink-200">{formatCurrency(trip.estimated_budget, 'INR')}</p>
                      <p className="text-xs text-sand-400 mt-0.5">budget</p>
                    </div>
                    <ChevronRight size={15} className="text-sand-400 group-hover:text-terracotta-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Destination Recommendations */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-label">Inspire Your Next Adventure</p>
              <h2 className="font-serif text-2xl font-semibold text-ink-200 mt-1">Curated Destinations</h2>
            </div>
            <button onClick={() => navigate('/explore')} className="btn-secondary text-sm gap-1.5">
              Explore All <ChevronRight size={15} />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-48 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {destinations.map((dest) => (
                <div
                  key={dest.id}
                  id={`dashboard-destination-${dest.id}`}
                  onClick={() => navigate('/explore')}
                  className="relative rounded-xl overflow-hidden h-48 cursor-pointer group hover-scale"
                >
                  <img
                    src={getDestinationImage(dest.city_name, dest.image_url)}
                    alt={dest.city_name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-200/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-white leading-tight">{dest.city_name}</h3>
                        <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {dest.country}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-terracotta-300 text-sm font-bold">
                          {getCostIndexSymbol(dest.cost_index)}
                        </p>
                        {dest.popularity_score && (
                          <p className="text-white/50 text-xs flex items-center gap-1">
                            <Star size={10} className="fill-ochre-400 stroke-none" />
                            {dest.popularity_score}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
