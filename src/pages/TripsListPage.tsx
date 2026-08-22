import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Map, Calendar, Wallet, ChevronRight, Loader2, Globe } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/tripFinancials';
import { formatDate, formatDateShort, getDaysBetween, getDestinationImage } from '../lib/utils';

interface Trip {
  id: string; title: string; description: string | null;
  start_date: string; end_date: string; estimated_budget: number;
  currency: string; cover_image_url: string | null; is_public: boolean;
}

export function TripsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('trips').select('*').eq('user_id', user.id).order('start_date', { ascending: false });
      if (data) setTrips(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const now = new Date();
  const filtered = trips.filter(t => {
    if (filter === 'upcoming') return new Date(t.start_date) >= now;
    if (filter === 'past') return new Date(t.end_date) < now;
    return true;
  });

  return (
    <div className="flex-1 overflow-auto bg-linen-100">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="section-label mb-2">Your Journeys</p>
            <h1 className="font-serif text-3xl font-bold text-ink-200">My Trips</h1>
          </div>
          <button onClick={() => navigate('/trips/new')} className="btn-primary" id="trips-list-new-trip-btn">
            <Plus size={16} /> Plan New Trip
          </button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2 mb-6">
          {(['all', 'upcoming', 'past'] as const).map(f => (
            <button
              key={f}
              id={`trips-filter-${f}`}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                filter === f
                  ? 'bg-terracotta-500 text-white border-terracotta-500'
                  : 'bg-white border-sand-300 text-sand-500 hover:border-terracotta-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-terracotta-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-20">
            <Globe size={40} className="mx-auto text-sand-300 mb-4" />
            <h3 className="font-serif text-xl font-semibold text-ink-200 mb-2">
              {filter === 'all' ? 'No trips yet' : `No ${filter} trips`}
            </h3>
            <p className="text-sand-500 text-sm mb-6">Start planning your next adventure</p>
            <button onClick={() => navigate('/trips/new')} className="btn-primary mx-auto" id="trips-empty-new-btn">
              <Plus size={16} /> Plan New Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map(trip => (
              <div
                key={trip.id}
                id={`trips-list-card-${trip.id}`}
                onClick={() => navigate(`/trips/${trip.id}/builder`)}
                className="card overflow-hidden p-0 cursor-pointer group hover-scale"
              >
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={getDestinationImage('', trip.cover_image_url)}
                    alt={trip.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-200/70 to-transparent" />
                  {trip.is_public && (
                    <div className="absolute top-3 right-3 badge bg-sage-500/90 text-white">
                      Public
                    </div>
                  )}
                  <h2 className="absolute bottom-4 left-5 font-serif text-xl font-bold text-white">
                    {trip.title}
                  </h2>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-5 text-xs text-sand-500 mb-4">
                    <span className="flex items-center gap-1.5"><Calendar size={12} />
                      {formatDateShort(trip.start_date)} – {formatDateShort(trip.end_date)}
                    </span>
                    <span className="flex items-center gap-1.5"><Map size={12} />
                      {getDaysBetween(trip.start_date, trip.end_date)} days
                    </span>
                    <span className="flex items-center gap-1.5"><Wallet size={12} />
                      {formatCurrency(trip.estimated_budget, trip.currency)}
                    </span>
                  </div>
                  {trip.description && (
                    <p className="text-sm text-ink-50/70 line-clamp-2 mb-4">{trip.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/trips/${trip.id}/timeline`); }}
                        id={`trips-timeline-btn-${trip.id}`}
                        className="btn-ghost text-xs px-3 py-1.5"
                      >
                        Timeline
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/trips/${trip.id}/budget`); }}
                        id={`trips-budget-btn-${trip.id}`}
                        className="btn-ghost text-xs px-3 py-1.5"
                      >
                        Budget
                      </button>
                    </div>
                    <ChevronRight size={16} className="text-sand-400 group-hover:text-terracotta-500 transition-colors" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
