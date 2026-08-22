import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Plus, MapPin, Calendar, Wallet, Trash2, ChevronDown,
  ChevronUp, Loader2, X, Save, BarChart2, Eye,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/tripFinancials';
import { formatDate, formatDateShort, getDaysBetween, getDestinationImage, cn } from '../lib/utils';

interface Trip {
  id: string; title: string; description: string | null;
  start_date: string; end_date: string; estimated_budget: number; currency: string;
  cover_image_url: string | null;
}

interface Stop {
  id: string; trip_id: string; destination_id: string; arrival_date: string;
  departure_date: string; stop_order: number; notes: string | null;
  transport_cost: number; accommodation_cost: number;
  destination?: { city_name: string; country: string; image_url: string | null };
}

interface Destination { id: string; city_name: string; country: string; image_url: string | null; }

function SortableStop({ stop, onDelete, onEdit }: {
  stop: Stop;
  onDelete: (id: string) => void;
  onEdit: (stop: Stop) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'card border border-sand-300 transition-all duration-200',
        isDragging && 'shadow-warm-xl rotate-1 border-terracotta-200 z-50 scale-[1.01]'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-sand-400 hover:text-ink-50 cursor-grab active:cursor-grabbing transition-colors shrink-0"
          id={`stop-drag-handle-${stop.id}`}
        >
          <GripVertical size={18} />
        </button>

        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <img
            src={getDestinationImage(stop.destination?.city_name ?? '', stop.destination?.image_url)}
            alt={stop.destination?.city_name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-ink-200 text-sm">
                Stop {stop.stop_order}: {stop.destination?.city_name ?? '—'}
              </p>
              <p className="text-xs text-sand-500 flex items-center gap-1.5 mt-0.5">
                <Calendar size={11} />
                {formatDateShort(stop.arrival_date)} → {formatDateShort(stop.departure_date)}
                <span className="text-sand-300">·</span>
                {getDaysBetween(stop.arrival_date, stop.departure_date)}d
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setExpanded(!expanded)}
                className="btn-ghost text-xs px-2 py-1.5"
                id={`stop-expand-${stop.id}`}
              >
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                onClick={() => onEdit(stop)}
                className="btn-ghost text-xs px-2 py-1.5"
                id={`stop-edit-${stop.id}`}
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(stop.id)}
                className="text-sand-400 hover:text-dusty-500 p-1.5 rounded-lg hover:bg-dusty-50 transition-all"
                id={`stop-delete-${stop.id}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 pt-4 border-t border-sand-200 grid grid-cols-2 gap-4 animate-fade-in">
              <div>
                <p className="text-xs text-sand-500 mb-1 uppercase tracking-wider font-semibold">Transport</p>
                <p className="font-serif text-lg font-semibold text-ink-200">
                  {formatCurrency(stop.transport_cost, 'INR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-sand-500 mb-1 uppercase tracking-wider font-semibold">Accommodation</p>
                <p className="font-serif text-lg font-semibold text-ink-200">
                  {formatCurrency(stop.accommodation_cost, 'INR')}
                </p>
              </div>
              {stop.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-sand-500 mb-1 uppercase tracking-wider font-semibold">Notes</p>
                  <p className="text-sm text-ink-50">{stop.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface AddStopModalProps {
  tripId: string;
  tripStart: string;
  tripEnd: string;
  onClose: () => void;
  onSave: () => void;
  editStop?: Stop | null;
}

function AddStopModal({ tripId, tripStart, tripEnd, onClose, onSave, editStop }: AddStopModalProps) {
  const [dests, setDests] = useState<Destination[]>([]);
  const [search, setSearch] = useState('');
  const [selDest, setSelDest] = useState<string>(editStop?.destination_id ?? '');
  const [arrival, setArrival] = useState(editStop?.arrival_date ?? tripStart);
  const [departure, setDeparture] = useState(editStop?.departure_date ?? tripEnd);
  const [transport, setTransport] = useState(String(editStop?.transport_cost ?? 0));
  const [accommodation, setAccommodation] = useState(String(editStop?.accommodation_cost ?? 0));
  const [notes, setNotes] = useState(editStop?.notes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      const q = supabase.from('destinations').select('id,city_name,country,image_url').limit(12);
      const { data } = search.length > 1 ? await q.ilike('city_name', `%${search}%`) : await q;
      if (data) setDests(data);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleSave = async () => {
    if (!selDest) return;
    setSaving(true);

    const payload = {
      trip_id: tripId,
      destination_id: selDest,
      arrival_date: arrival,
      departure_date: departure,
      transport_cost: parseFloat(transport) || 0,
      accommodation_cost: parseFloat(accommodation) || 0,
      notes,
    };

    if (editStop) {
      await supabase.from('trip_stops').update(payload).eq('id', editStop.id);
    } else {
      const { data: existing } = await supabase
        .from('trip_stops').select('stop_order').eq('trip_id', tripId).order('stop_order', { ascending: false }).limit(1);
      const nextOrder = (existing?.[0]?.stop_order ?? 0) + 1;
      await supabase.from('trip_stops').insert([{ ...payload, stop_order: nextOrder }]);
    }
    setSaving(false);
    onSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-200/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-warm-xl w-full max-w-lg mx-4 animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-sand-200">
          <h3 className="font-serif text-xl font-semibold text-ink-200">
            {editStop ? 'Edit Stop' : 'Add New Stop'}
          </h3>
          <button onClick={onClose} className="text-sand-400 hover:text-ink-200 transition-colors" id="add-stop-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Destination Search */}
          {!editStop && (
            <div className="space-y-2">
              <label className="label">Destination</label>
              <input
                type="text"
                className="input"
                placeholder="Search city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                id="add-stop-dest-search"
              />
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {dests.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    id={`add-stop-dest-${d.id}`}
                    onClick={() => setSelDest(d.id)}
                    className={cn(
                      'relative rounded-lg overflow-hidden h-20 text-left transition-all',
                      selDest === d.id ? 'ring-2 ring-terracotta-500' : 'hover:scale-[1.02]'
                    )}
                  >
                    <img src={getDestinationImage(d.city_name, d.image_url)} alt={d.city_name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-200/80 to-transparent" />
                    {selDest === d.id && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-terracotta-500 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                    <p className="absolute bottom-1.5 left-2 text-white text-xs font-semibold">{d.city_name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label">Arrival Date</label>
              <input type="date" className="input" value={arrival} min={tripStart} max={tripEnd}
                onChange={e => setArrival(e.target.value)} id="add-stop-arrival" />
            </div>
            <div className="space-y-1.5">
              <label className="label">Departure Date</label>
              <input type="date" className="input" value={departure} min={arrival} max={tripEnd}
                onChange={e => setDeparture(e.target.value)} id="add-stop-departure" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label">Transport Cost (₹)</label>
              <input type="number" className="input" value={transport}
                onChange={e => setTransport(e.target.value)} id="add-stop-transport" placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <label className="label">Accommodation Cost (₹)</label>
              <input type="number" className="input" value={accommodation}
                onChange={e => setAccommodation(e.target.value)} id="add-stop-accommodation" placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="label">Notes</label>
            <textarea className="input min-h-[80px] resize-none" value={notes}
              onChange={e => setNotes(e.target.value)} placeholder="Any notes for this stop..." id="add-stop-notes" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-sand-200">
          <button onClick={onClose} className="btn-secondary" id="add-stop-cancel-btn">Cancel</button>
          <button onClick={handleSave} disabled={saving || (!editStop && !selDest)} className="btn-primary" id="add-stop-save-btn">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Save Stop'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ItineraryBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStop, setShowAddStop] = useState(false);
  const [editStop, setEditStop] = useState<Stop | null>(null);
  const [liveTotal, setLiveTotal] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadData = useCallback(async () => {
    if (!id) return;
    const [tripRes, stopsRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', id).single(),
      supabase.from('trip_stops').select('*, destination:destinations(city_name,country,image_url)')
        .eq('trip_id', id).order('stop_order'),
    ]);
    if (tripRes.data) setTrip(tripRes.data);
    if (stopsRes.data) {
      setStops(stopsRes.data as Stop[]);
      const total = stopsRes.data.reduce(
        (s: number, st: any) => s + (parseFloat(st.transport_cost) || 0) + (parseFloat(st.accommodation_cost) || 0), 0
      );
      setLiveTotal(total);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = stops.findIndex(s => s.id === active.id);
    const newIdx = stops.findIndex(s => s.id === over.id);
    const reordered = arrayMove(stops, oldIdx, newIdx);
    setStops(reordered);

    // Write new stop_order values to Supabase
    await Promise.all(
      reordered.map((stop, idx) =>
        supabase.from('trip_stops').update({ stop_order: idx + 1 }).eq('id', stop.id)
      )
    );
  };

  const handleDeleteStop = async (stopId: string) => {
    await supabase.from('trip_stops').delete().eq('id', stopId);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-linen-100">
        <Loader2 size={28} className="animate-spin text-terracotta-500" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex-1 flex items-center justify-center bg-linen-100">
        <p className="text-sand-500">Trip not found.</p>
      </div>
    );
  }

  const budgetPct = trip.estimated_budget > 0
    ? Math.min(100, (liveTotal / trip.estimated_budget) * 100) : 0;

  return (
    <div className="flex-1 overflow-auto bg-linen-100">
      {/* Cover Header */}
      <div className="relative h-52 overflow-hidden">
        <img
          src={getDestinationImage('', trip.cover_image_url)}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-200/80 via-ink-200/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-8 py-6 flex items-end justify-between">
          <div>
            <p className="section-label text-white/60 mb-1">Itinerary Builder</p>
            <h1 className="font-serif text-3xl font-bold text-white">{trip.title}</h1>
            <p className="text-white/60 text-sm mt-1">
              {formatDate(trip.start_date)} → {formatDate(trip.end_date)}
              <span className="mx-2 text-white/30">·</span>
              {getDaysBetween(trip.start_date, trip.end_date)} days
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/trips/${id}/timeline`)}
              className="btn-secondary text-sm gap-2"
              id="builder-view-timeline-btn"
            >
              <Eye size={15} /> Timeline
            </button>
            <button
              onClick={() => navigate(`/trips/${id}/budget`)}
              className="btn-secondary text-sm gap-2"
              id="builder-view-budget-btn"
            >
              <BarChart2 size={15} /> Budget
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6 px-8 py-8">
        {/* Sidebar summary */}
        <div className="w-64 shrink-0 space-y-4">
          <div className="card">
            <p className="section-label mb-3">Trip Summary</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-sand-400" />
                <p className="text-xs text-ink-50">
                  {getDaysBetween(trip.start_date, trip.end_date)} days
                </p>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-sand-400" />
                <p className="text-xs text-ink-50">{stops.length} stops</p>
              </div>
              <div className="flex items-center gap-2">
                <Wallet size={14} className="text-sand-400" />
                <p className="text-xs text-ink-50">
                  {formatCurrency(liveTotal, 'INR')} / {formatCurrency(trip.estimated_budget, 'INR')}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <p className="section-label mb-3">Budget Status</p>
            <p className="font-serif text-2xl font-bold text-ink-200 mb-1">
              {formatCurrency(liveTotal, 'INR')}
            </p>
            <p className="text-xs text-sand-500 mb-3">of {formatCurrency(trip.estimated_budget, 'INR')} budgeted</p>
            <div className="progress-track">
              <div
                className={budgetPct >= 100 ? 'progress-fill-danger' : budgetPct >= 80 ? 'h-full bg-ochre-400 rounded-full' : 'progress-fill-safe'}
                style={{ width: `${Math.min(100, budgetPct)}%` }}
              />
            </div>
            <p className={`text-xs mt-2 font-semibold ${budgetPct >= 100 ? 'text-dusty-500' : 'text-sage-600'}`}>
              {budgetPct >= 100 ? `Over by ${formatCurrency(liveTotal - trip.estimated_budget, 'INR')}` : `${formatCurrency(trip.estimated_budget - liveTotal, 'INR')} remaining`}
            </p>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-ink-200">
              Trip Stops <span className="text-sand-400 text-base font-normal">({stops.length})</span>
            </h2>
            <button
              onClick={() => setShowAddStop(true)}
              className="btn-primary text-sm"
              id="builder-add-stop-btn"
            >
              <Plus size={15} /> Add Stop
            </button>
          </div>

          {stops.length === 0 ? (
            <div className="card text-center py-16">
              <MapPin size={40} className="mx-auto text-sand-300 mb-4" />
              <h3 className="font-serif text-xl font-semibold text-ink-200 mb-2">No stops yet</h3>
              <p className="text-sand-500 text-sm mb-5">Add cities to your itinerary to start building your journey</p>
              <button onClick={() => setShowAddStop(true)} className="btn-primary mx-auto" id="builder-first-stop-btn">
                <Plus size={16} /> Add First Stop
              </button>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {stops.map(stop => (
                    <SortableStop
                      key={stop.id}
                      stop={stop}
                      onDelete={handleDeleteStop}
                      onEdit={(s) => { setEditStop(s); setShowAddStop(true); }}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {(showAddStop) && (
        <AddStopModal
          tripId={id!}
          tripStart={trip.start_date}
          tripEnd={trip.end_date}
          onClose={() => { setShowAddStop(false); setEditStop(null); }}
          onSave={loadData}
          editStop={editStop}
        />
      )}
    </div>
  );
}
