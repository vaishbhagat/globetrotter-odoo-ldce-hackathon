import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Star, Heart, Compass } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { getCostIndexSymbol, getCostIndexLabel } from '../lib/tripFinancials';
import { getDestinationImage, cn } from '../lib/utils';

interface Destination {
  id: string;
  city_name: string;
  country: string;
  region: string | null;
  description: string | null;
  image_url: string | null;
  cost_index: number | null;
  popularity_score: number | null;
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden p-0">
      <div className="skeleton h-52 rounded-none" />
      <div className="p-5 space-y-3">
        <div className="skeleton h-5 rounded w-2/3" />
        <div className="skeleton h-3.5 rounded w-1/2" />
        <div className="skeleton h-3 rounded w-full" />
        <div className="skeleton h-3 rounded w-3/4" />
      </div>
    </div>
  );
}

export function ExplorePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    if (profile?.saved_destinations) {
      setSaved(profile.saved_destinations);
    }
  }, [profile]);

  const loadDests = useCallback(async () => {
    setLoading(true);
    const q = supabase.from('destinations').select('*').order('popularity_score', { ascending: false });
    const { data } = search.length > 1 ? await q.ilike('city_name', `%${search}%`) : await q.limit(24);
    if (data) setDestinations(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(loadDests, 300);
    return () => clearTimeout(t);
  }, [loadDests]);

  const toggleSave = async (destId: string) => {
    if (!user) return;
    const isSaved = saved.includes(destId);
    const next = isSaved ? saved.filter(id => id !== destId) : [...saved, destId];
    setSaved(next);
    await supabase
      .from('profiles')
      .update({ saved_destinations: next })
      .eq('id', user.id);
    refreshProfile();
  };

  return (
    <div className="flex-1 overflow-auto bg-linen-100">
      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="section-label mb-2">Discover the World</p>
          <h1 className="font-serif text-4xl font-bold text-ink-200">Explore Destinations</h1>
          <p className="text-sand-500 text-sm mt-2">Find your next adventure from our curated collection</p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mb-10">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-sand-400" />
          <input
            type="text"
            id="explore-search-input"
            className="input pl-11 py-3 text-base"
            placeholder="Search cities, countries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-2 mb-6">
          <Compass size={15} className="text-sand-400" />
          <p className="text-sm text-sand-500">
            {loading ? 'Loading...' : `${destinations.length} destinations found`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center py-20">
            <Compass size={40} className="mx-auto text-sand-300 mb-4" />
            <h3 className="font-serif text-xl font-semibold text-ink-200 mb-2">No destinations found</h3>
            <p className="text-sand-500 text-sm">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {destinations.map(dest => {
              const isSaved = saved.includes(dest.id);
              return (
                <div
                  key={dest.id}
                  id={`explore-dest-${dest.id}`}
                  className="card overflow-hidden p-0 group hover-scale cursor-pointer"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={getDestinationImage(dest.city_name, dest.image_url)}
                      alt={dest.city_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-200/60 to-transparent" />

                    {/* Save button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSave(dest.id); }}
                      id={`explore-save-${dest.id}`}
                      className={cn(
                        'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                        isSaved
                          ? 'bg-terracotta-500 text-white'
                          : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/40'
                      )}
                    >
                      <Heart size={14} className={isSaved ? 'fill-white' : ''} />
                    </button>

                    {/* Cost index */}
                    <div className="absolute bottom-3 right-3">
                      <span className="text-terracotta-300 font-bold text-sm bg-ink-200/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        {getCostIndexSymbol(dest.cost_index)}
                      </span>
                    </div>

                    {/* Popularity */}
                    {dest.popularity_score && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-ink-200/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        <Star size={11} className="text-ochre-400 fill-ochre-400" />
                        <span className="text-white text-xs font-medium">{dest.popularity_score}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-1.5">
                      <h3 className="font-serif text-lg font-bold text-ink-200">{dest.city_name}</h3>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-sand-500 mb-3">
                      <MapPin size={11} /> {dest.country}
                      {dest.region && <span className="text-sand-300">· {dest.region}</span>}
                    </p>
                    {dest.description && (
                      <p className="text-xs text-ink-50/70 leading-relaxed line-clamp-2">{dest.description}</p>
                    )}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="badge-terracotta">{getCostIndexLabel(dest.cost_index)}</span>
                      {isSaved && (
                        <span className="text-xs text-terracotta-500 font-semibold flex items-center gap-1">
                          <Heart size={11} className="fill-terracotta-500" /> Saved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
