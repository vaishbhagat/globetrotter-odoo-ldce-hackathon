import { supabase } from './supabaseClient';

export interface TripFinancials {
  grandTotal: number;
  categoryBreakdown: {
    transport: number;
    accommodation: number;
    activities: number;
    meals: number;
    other: number;
  };
  stopExpenses: number;
  activityExpenses: number;
}

export async function calculateTripFinancials(tripId: string): Promise<TripFinancials> {
  const { data: stops, error: stopsErr } = await supabase
    .from('trip_stops')
    .select('id, transport_cost, accommodation_cost')
    .eq('trip_id', tripId);

  if (stopsErr || !stops) throw new Error('Error fetching trip stops for financials');

  let stopExpenses = 0;
  const stopIds: string[] = [];
  const categoryBreakdown = {
    transport: 0,
    accommodation: 0,
    activities: 0,
    meals: 0,
    other: 0,
  };

  stops.forEach((stop) => {
    const tc = parseFloat(String(stop.transport_cost)) || 0;
    const ac = parseFloat(String(stop.accommodation_cost)) || 0;
    stopExpenses += tc + ac;
    categoryBreakdown.transport += tc;
    categoryBreakdown.accommodation += ac;
    stopIds.push(stop.id);
  });

  let activityExpenses = 0;

  if (stopIds.length > 0) {
    const { data: itineraryActs, error: actErr } = await supabase
      .from('itinerary_activities')
      .select('custom_cost, activities(category)')
      .in('trip_stop_id', stopIds);

    if (actErr) throw new Error('Error fetching activities for financials');

    itineraryActs?.forEach((item: any) => {
      const cost = parseFloat(String(item.custom_cost)) || 0;
      activityExpenses += cost;

      const cat = item.activities?.category?.toLowerCase() || 'activities';
      const mappedCat = cat in categoryBreakdown ? cat : 'activities';
      categoryBreakdown[mappedCat as keyof typeof categoryBreakdown] += cost;
    });
  }

  const grandTotal = stopExpenses + activityExpenses;
  return { grandTotal, categoryBreakdown, stopExpenses, activityExpenses };
}

export async function deepCloneSharedItinerary(sourceTripId: string, targetUserId: string) {
  const { data: sourceTrip, error: tripErr } = await supabase
    .from('trips')
    .select('*')
    .eq('id', sourceTripId)
    .single();

  if (tripErr || !sourceTrip) throw new Error('Failed to read public trip source blueprint.');

  const { data: newTrip, error: cloneErr } = await supabase
    .from('trips')
    .insert([
      {
        user_id: targetUserId,
        title: `Clone of ${sourceTrip.title}`,
        description: sourceTrip.description,
        start_date: sourceTrip.start_date,
        end_date: sourceTrip.end_date,
        cover_image_url: sourceTrip.cover_image_url,
        estimated_budget: sourceTrip.estimated_budget,
        is_public: false,
      },
    ])
    .select()
    .single();

  if (cloneErr || !newTrip) throw new Error('Failed to clone main trip header.');

  const { data: stops, error: stopsErr } = await supabase
    .from('trip_stops')
    .select('*')
    .eq('trip_id', sourceTripId);

  if (stopsErr || !stops) return newTrip;

  for (const stop of stops) {
    const { data: newStop, error: newStopErr } = await supabase
      .from('trip_stops')
      .insert([
        {
          trip_id: newTrip.id,
          destination_id: stop.destination_id,
          arrival_date: stop.arrival_date,
          departure_date: stop.departure_date,
          stop_order: stop.stop_order,
          notes: stop.notes,
          transport_cost: stop.transport_cost,
          accommodation_cost: stop.accommodation_cost,
        },
      ])
      .select()
      .single();

    if (newStopErr || !newStop) continue;

    const { data: itineraryActs, error: actsErr } = await supabase
      .from('itinerary_activities')
      .select('*')
      .eq('trip_stop_id', stop.id);

    if (!actsErr && itineraryActs?.length > 0) {
      const clonedActivities = itineraryActs.map((act: any) => ({
        trip_stop_id: newStop.id,
        activity_id: act.activity_id,
        activity_date: act.activity_date,
        start_time: act.start_time,
        end_time: act.end_time,
        custom_cost: act.custom_cost,
        notes: act.notes,
        activity_order: act.activity_order,
      }));

      await supabase.from('itinerary_activities').insert(clonedActivities);
    }
  }

  return newTrip;
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getBudgetStatus(spent: number, budget: number): 'safe' | 'warning' | 'danger' {
  const pct = (spent / budget) * 100;
  if (pct >= 100) return 'danger';
  if (pct >= 80) return 'warning';
  return 'safe';
}

export function getCostIndexLabel(index: number | null): string {
  const labels: Record<number, string> = {
    1: 'Budget',
    2: 'Economy',
    3: 'Moderate',
    4: 'Upscale',
    5: 'Luxury',
  };
  return labels[index ?? 1] ?? 'Unknown';
}

export function getCostIndexSymbol(index: number | null): string {
  return '₹'.repeat(Math.max(1, Math.min(5, index ?? 1)));
}
