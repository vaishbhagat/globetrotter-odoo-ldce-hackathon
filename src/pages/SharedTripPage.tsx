import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Globe, MapPin, Calendar, Wallet, Copy, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { deepCloneSharedItinerary } from '../lib/tripFinancials';
import { formatDate, formatDateShort, getDaysBetween, getDestinationImage } from '../lib/utils';
import { formatCurrency } from '../lib/tripFinancials';

interface Trip {
  id: string; title: string; description: string | null;
  start_date: string; end_date: string; estimated_budget: number;
  cover_image_url: string | null; is_public: boolean; public_slug: string | null;
}

interface Stop {
  id: string; stop_order: number; arrival_date: string; departure_date: string;
  notes: string | null; transport_cost: number; accommodation_cost: number;
  destination?: { city_name: string; country: string; image_url: string | null };
}

export function SharedTripPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [cloning, setCloning] = useState(false);
  const [cloned, setCloned] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data: tripData } = await supabase
        .from('trips').select('*').eq('public_slug', slug).eq('is_public', true).single();

      if (!tripData) { setError('This trip is private or does not exist.'); setLoading(false); return; }
      setTrip(tripData);

      const { data: stopsData } = await supabase
        .from('trip_stops')
        .select('*, destination:destinations(city_name,country,image_url)')
        .eq('trip_id', tripData.id)
        .order('stop_order');

      if (stopsData) setStops(stopsData as Stop[]);
      setLoading(false);
    };
    load();
  }, [slug]);

  const handleClone = async () => {
    if (!user || !trip) return;
    setCloning(true);
    try {
      await deepCloneSharedItinerary(trip.id, user.id);
      setCloned(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCloning(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-linen-100 flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-terracotta-500" />
    </div>;
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-linen-100 flex flex-col items-center justify-center text-center px-6">
        <Globe size={48} className="text-sand-300 mb-4" />
        <h1 className="font-serif text-2xl font-bold text-ink-200 mb-2">Trip Not Found</h1>
        <p className="text-sand-500 text-sm">{error || 'This itinerary is not publicly shared.'}</p>
      </div>
    );
  }

  const totalCost = stops.reduce((s, st) =>
    s + (parseFloat(String(st.transport_cost)) || 0) + (parseFloat(String(st.accommodation_cost)) || 0), 0);

  return (
    <div className="min-h-screen bg-linen-100">
      {/* Hero */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={getDestinationImage('', trip.cover_image_url)}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-200/90 via-ink-200/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={14} className="text-terracotta-300" />
            <span className="section-label text-white/60">Shared Itinerary</span>
          </div>
          <h1 className="font-serif text-5xl font-bold text-white mb-3">{trip.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-white/70 text-sm">
            <span className="flex items-center gap-2"><Calendar size={14} /> {formatDate(trip.start_date)} → {formatDate(trip.end_date)}</span>
            <span className="flex items-center gap-2"><MapPin size={14} /> {stops.length} stops</span>
            <span className="flex items-center gap-2"><Wallet size={14} /> {formatCurrency(totalCost, 'INR')}</span>
            
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: trip.title, url: window.location.href });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="flex items-center gap-2 hover:text-white transition-colors border border-white/20 rounded-full px-3 py-1"
            >
              <Copy size={12} /> Share Trip
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {trip.description && (
          <p className="text-ink-50 text-base leading-relaxed mb-10 max-w-2xl">{trip.description}</p>
        )}

        {/* Clone CTA */}
        {user && !cloned && (
          <div className="sticky top-4 z-10 mb-10">
            <div className="bg-white border border-sand-300 rounded-2xl shadow-warm-lg p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink-200 text-sm">Love this itinerary?</p>
                <p className="text-sand-500 text-xs mt-0.5">Copy it to your account and customize it</p>
              </div>
              <button
                onClick={handleClone}
                disabled={cloning}
                id="shared-trip-clone-btn"
                className="btn-primary"
              >
                {cloning ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
                {cloning ? 'Copying...' : 'Copy to My Trips'}
              </button>
            </div>
          </div>
        )}

        {cloned && (
          <div className="mb-10 p-5 bg-sage-50 border border-sage-100 rounded-xl flex items-center gap-3">
            <CheckCircle2 size={20} className="text-sage-600 shrink-0" />
            <div>
              <p className="font-semibold text-sage-700">Trip copied successfully!</p>
              <p className="text-xs text-sage-600 mt-0.5">Find it in your trips dashboard.</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-8">
          <h2 className="font-serif text-2xl font-bold text-ink-200">The Journey</h2>
          <div className="relative">
            <div className="absolute left-5 top-6 bottom-6 w-px bg-sand-300" />
            <div className="space-y-6">
              {stops.map((stop, idx) => (
                <div key={stop.id} className="flex gap-6 relative animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-terracotta-gradient flex items-center justify-center text-white font-bold text-sm shrink-0 relative z-10">
                    {stop.stop_order}
                  </div>
                  <div className="flex-1 card hover-scale">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <img
                          src={getDestinationImage(stop.destination?.city_name ?? '', stop.destination?.image_url)}
                          alt={stop.destination?.city_name}
                          className="w-16 h-16 rounded-lg object-cover shrink-0"
                        />
                        <div>
                          <h3 className="font-serif text-xl font-bold text-ink-200">
                            {stop.destination?.city_name ?? `Stop ${stop.stop_order}`}
                          </h3>
                          <p className="text-sm text-sand-500 flex items-center gap-1 mt-1">
                            <MapPin size={12} /> {stop.destination?.country}
                          </p>
                          <p className="text-xs text-sand-400 flex items-center gap-1 mt-1">
                            <Calendar size={11} />
                            {formatDateShort(stop.arrival_date)} – {formatDateShort(stop.departure_date)}
                            <span className="text-sand-300">·</span>
                            {getDaysBetween(stop.arrival_date, stop.departure_date)}d
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-sand-500 mb-1">Stop Cost</p>
                        <p className="font-serif text-xl font-bold text-ink-200">
                          {formatCurrency(
                            (parseFloat(String(stop.transport_cost)) || 0) + (parseFloat(String(stop.accommodation_cost)) || 0),
                            'INR'
                          )}
                        </p>
                      </div>
                    </div>
                    {stop.notes && (
                      <p className="text-sm text-ink-50/70 mt-4 pt-4 border-t border-sand-200 leading-relaxed">
                        {stop.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        {!user && (
          <div className="mt-12 text-center">
            <p className="text-sand-500 text-sm mb-4">Sign in to copy this itinerary to your account</p>
            <a href="/auth" className="btn-primary inline-flex">
              Get Started Free <ArrowRight size={16} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
