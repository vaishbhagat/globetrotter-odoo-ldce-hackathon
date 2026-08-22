import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Plus, List, Grid3x3, Loader2, X, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { formatDateShort, getCategoryColor, getCategoryDot, cn } from '../lib/utils';
import { formatCurrency } from '../lib/tripFinancials';

interface Stop {
  id: string; destination_id: string; arrival_date: string; departure_date: string;
  stop_order: number;
  destination?: { city_name: string; country: string };
}

interface ItineraryActivity {
  id: string; trip_stop_id: string; activity_date: string;
  start_time: string | null; end_time: string | null;
  custom_cost: number; notes: string | null; activity_order: number;
  activity?: { id: string; name: string; category: string; description: string | null };
}

interface Activity {
  id: string; name: string; description: string; category: string;
  estimated_cost: number; currency: string; duration_minutes: number;
}

interface ActivityDrawerProps {
  stopId: string;
  activityDate: string;
  destinationId: string;
  onClose: () => void;
  onSave: () => void;
}

function ActivityDrawer({ stopId, activityDate, destinationId, onClose, onSave }: ActivityDrawerProps) {
  const [tab, setTab] = useState<'browse' | 'custom'>('browse');
  const [availableActs, setAvailableActs] = useState<Activity[]>([]);
  const [search, setSearch] = useState('');
  const [loadingActs, setLoadingActs] = useState(true);

  // Custom tab state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Sightseeing');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [cost, setCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const categories = ['Sightseeing', 'Food', 'Adventure', 'Culture', 'Nature', 'Shopping', 'Entertainment', 'Relaxation'];

  useEffect(() => {
    async function fetchActivities() {
      if (tab !== 'browse') return;
      setLoadingActs(true);
      const { data } = await supabase
        .from('activities')
        .select('*')
        .eq('destination_id', destinationId);
      setAvailableActs((data ?? []) as Activity[]);
      setLoadingActs(false);
    }
    fetchActivities();
  }, [destinationId, tab]);

  const handleAddPredefined = async (act: Activity) => {
    setSaving(true);
    const { data: existing } = await supabase
      .from('itinerary_activities')
      .select('activity_order')
      .eq('trip_stop_id', stopId)
      .order('activity_order', { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.activity_order ?? 0) + 1;

    await supabase.from('itinerary_activities').insert([{
      trip_stop_id: stopId,
      activity_id: act.id,
      activity_date: activityDate,
      start_time: '09:00', // Default, user can edit later
      end_time: '11:00',
      custom_cost: act.estimated_cost,
      activity_order: nextOrder,
    }]);
    setSaving(false);
    onSave();
    onClose();
  };

  const handleSaveCustom = async () => {
    setSaving(true);
    const { data: existing } = await supabase
      .from('itinerary_activities')
      .select('activity_order')
      .eq('trip_stop_id', stopId)
      .order('activity_order', { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.activity_order ?? 0) + 1;

    await supabase.from('itinerary_activities').insert([{
      trip_stop_id: stopId,
      activity_date: activityDate,
      start_time: startTime,
      end_time: endTime,
      custom_cost: parseFloat(cost) || 0,
      notes: notes || name,
      activity_order: nextOrder,
    }]);
    setSaving(false);
    onSave();
    onClose();
  };

  const filteredActs = availableActs.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-200/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md h-full shadow-warm-xl animate-slide-left flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-sand-200">
          <h3 className="font-serif text-xl font-bold text-ink-200">Add Activity</h3>
          <button onClick={onClose} className="text-sand-400 hover:text-ink-200" id="add-activity-close-btn">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex bg-sand-200 p-1 mx-6 mt-6 rounded-lg">
          {(['browse', 'custom'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-2 text-sm font-semibold rounded transition-colors', tab === t ? 'bg-white text-ink-200 shadow-warm-sm' : 'text-sand-500 hover:text-ink-50')}>
              {t === 'browse' ? 'Browse' : 'Custom'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'browse' ? (
            <div className="space-y-4">
              <input type="text" className="input" placeholder="Search activities..." value={search} onChange={e => setSearch(e.target.value)} />
              {loadingActs ? (
                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-terracotta-500" /></div>
              ) : filteredActs.length === 0 ? (
                <p className="text-center text-sand-500 py-10">No activities found.</p>
              ) : (
                <div className="space-y-3">
                  {filteredActs.map(act => (
                    <div key={act.id} className="card p-4 hover-scale flex flex-col border border-sand-200 hover:border-terracotta-200">
                      <div className="flex justify-between items-start mb-2">
                        <span className={getCategoryColor(act.category) + ' badge'}>{act.category}</span>
                        <p className="font-serif font-bold text-ink-200">{formatCurrency(act.estimated_cost, act.currency)}</p>
                      </div>
                      <h4 className="font-semibold text-ink-200 mb-1">{act.name}</h4>
                      <p className="text-xs text-sand-500 mb-4 line-clamp-2">{act.description}</p>
                      <button onClick={() => handleAddPredefined(act)} disabled={saving} className="btn-primary w-full justify-center text-xs py-2 mt-auto">
                        <Plus size={14} /> Add to Plan
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5"><label className="label">Activity Name</label><input className="input" placeholder="e.g., Visit Senso-ji Temple" value={name} onChange={e => setName(e.target.value)} /></div>
              <div className="space-y-1.5"><label className="label">Category</label><select className="input" value={category} onChange={e => setCategory(e.target.value)}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><label className="label">Start Time</label><input type="time" className="input" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
                <div className="space-y-1.5"><label className="label">End Time</label><input type="time" className="input" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><label className="label">Cost (₹)</label><input type="number" className="input" placeholder="0" value={cost} onChange={e => setCost(e.target.value)} /></div>
              <div className="space-y-1.5"><label className="label">Notes</label><textarea className="input resize-none min-h-[70px]" placeholder="Any notes..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
              <button onClick={handleSaveCustom} disabled={saving || !name} className="btn-primary w-full justify-center py-3 mt-4">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Custom Activity
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TimelinePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [stops, setStops] = useState<Stop[]>([]);
  const [activities, setActivities] = useState<Record<string, ItineraryActivity[]>>({});
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState<{ stopId: string; date: string; destinationId: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    const { data: stopsData } = await supabase
      .from('trip_stops')
      .select('*, destination:destinations(city_name,country)')
      .eq('trip_id', id)
      .order('stop_order');

    if (!stopsData) { setLoading(false); return; }
    setStops(stopsData as Stop[]);

    const allActivities: Record<string, ItineraryActivity[]> = {};
    for (const stop of stopsData) {
      const { data: acts } = await supabase
        .from('itinerary_activities')
        .select('*, activity:activities(id,name,category,description)')
        .eq('trip_stop_id', stop.id)
        .order('activity_order');
      allActivities[stop.id] = (acts ?? []) as ItineraryActivity[];
    }
    setActivities(allActivities);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const deleteActivity = async (actId: string, stopId: string) => {
    await supabase.from('itinerary_activities').delete().eq('id', actId);
    setActivities(prev => ({
      ...prev,
      [stopId]: (prev[stopId] ?? []).filter(a => a.id !== actId),
    }));
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center bg-linen-100">
      <Loader2 size={28} className="animate-spin text-terracotta-500" />
    </div>;
  }

  return (
    <div className="flex-1 overflow-auto bg-linen-100">
      <div className="max-w-4xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button onClick={() => navigate(`/trips/${id}/builder`)} className="flex items-center gap-1.5 text-sm text-sand-500 hover:text-terracotta-500 mb-3 transition-colors">
              <ArrowLeft size={14} /> Back to Builder
            </button>
            <h1 className="font-serif text-3xl font-bold text-ink-200">Trip Timeline</h1>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-sand-300 rounded-lg p-1 gap-1">
            {([
              { mode: 'timeline', icon: List, label: 'Timeline' },
              { mode: 'grid', icon: Grid3x3, label: 'Grid' },
            ] as const).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                id={`timeline-toggle-${mode}`}
                onClick={() => setViewMode(mode)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all',
                  viewMode === mode ? 'bg-terracotta-500 text-white' : 'text-sand-500 hover:text-ink-50'
                )}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>

        {stops.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-sand-500">No stops added yet. Go to the builder to add stops.</p>
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="space-y-10">
            {stops.map((stop) => {
              const stopActs = activities[stop.id] ?? [];
              return (
                <div key={stop.id} className="animate-fade-in">
                  {/* Stop Header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-terracotta-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {stop.stop_order}
                    </div>
                    <div className="flex-1">
                      <h2 className="font-serif text-xl font-bold text-ink-200">
                        {stop.destination?.city_name ?? '—'}
                      </h2>
                      <p className="text-xs text-sand-500">
                        {formatDateShort(stop.arrival_date)} → {formatDateShort(stop.departure_date)}
                      </p>
                    </div>
                    <button
                      onClick={() => setAddModal({ stopId: stop.id, date: stop.arrival_date, destinationId: stop.destination_id })}
                      className="btn-primary text-xs"
                      id={`timeline-add-activity-${stop.id}`}
                    >
                      <Plus size={14} /> Add Activity
                    </button>
                  </div>

                  {/* Activities */}
                  <div className="relative pl-8">
                    <div className="timeline-line" />
                    {stopActs.length === 0 ? (
                      <div className="card border-dashed text-center py-8 mb-4">
                        <p className="text-sand-400 text-sm">No activities added for this stop.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {stopActs.map((act, idx) => (
                          <div key={act.id} className="relative">
                            {/* Timeline dot */}
                            <div className={`absolute left-[-24px] top-4 w-3 h-3 rounded-full border-2 border-white ${getCategoryDot(act.activity?.category ?? 'other')}`} />
                            <div className="card hover-scale group">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    {act.start_time && (
                                      <span className="flex items-center gap-1 text-xs text-sand-500">
                                        <Clock size={11} />
                                        {act.start_time}{act.end_time ? ` – ${act.end_time}` : ''}
                                      </span>
                                    )}
                                    <span className={getCategoryColor(act.activity?.category ?? 'other') + ' badge'}>
                                      {act.activity?.category ?? 'Activity'}
                                    </span>
                                  </div>
                                  <h3 className="font-semibold text-ink-200 text-sm">
                                    {act.activity?.name ?? act.notes ?? 'Custom Activity'}
                                  </h3>
                                  {act.notes && act.activity && (
                                    <p className="text-xs text-sand-500 mt-1">{act.notes}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 ml-4">
                                  <p className="font-serif text-lg font-bold text-ink-200">
                                    {formatCurrency(act.custom_cost, 'INR')}
                                  </p>
                                  <button
                                    onClick={() => deleteActivity(act.id, stop.id)}
                                    className="text-sand-300 hover:text-dusty-500 transition-colors opacity-0 group-hover:opacity-100"
                                    id={`delete-activity-${act.id}`}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid Calendar View */
          <div className="space-y-6">
            {stops.map(stop => {
              const stopActs = activities[stop.id] ?? [];
              return (
                <div key={stop.id} className="card animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-serif text-lg font-semibold text-ink-200">
                      {stop.destination?.city_name}
                    </h2>
                    <button
                      onClick={() => setAddModal({ stopId: stop.id, date: stop.arrival_date, destinationId: stop.destination_id })}
                      className="btn-primary text-xs"
                      id={`grid-add-activity-${stop.id}`}
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                  {stopActs.length === 0 ? (
                    <p className="text-sand-400 text-sm text-center py-6">No activities yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {stopActs.map(act => (
                        <div key={act.id} className="p-3 bg-linen-100 border border-sand-200 rounded-lg hover:border-terracotta-200 transition-colors group">
                          <div className="flex items-start justify-between mb-2">
                            <span className={getCategoryColor(act.activity?.category ?? 'other') + ' badge text-xs'}>
                              {act.activity?.category ?? 'Activity'}
                            </span>
                            <button
                              onClick={() => deleteActivity(act.id, stop.id)}
                              className="text-sand-300 hover:text-dusty-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <p className="font-semibold text-ink-200 text-xs mb-1 truncate">
                            {act.activity?.name ?? act.notes ?? 'Activity'}
                          </p>
                          {act.start_time && (
                            <p className="text-xs text-sand-400">{act.start_time}</p>
                          )}
                          <p className="text-xs font-semibold text-terracotta-600 mt-1">
                            {formatCurrency(act.custom_cost, 'INR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addModal && (
        <ActivityDrawer
          stopId={addModal.stopId}
          activityDate={addModal.date}
          destinationId={addModal.destinationId}
          onClose={() => setAddModal(null)}
          onSave={loadData}
        />
      )}
    </div>
  );
}
