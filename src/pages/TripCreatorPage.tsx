import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, ChevronRight, Upload, X, Search, Loader2, Globe, Calendar, DollarSign, FileText } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { cn, generateSlug, getDestinationImage } from '../lib/utils';
import { formatCurrency } from '../lib/tripFinancials';

const steps = [
  { id: 1, label: 'Details', icon: FileText },
  { id: 2, label: 'Destinations', icon: Globe },
  { id: 3, label: 'Budget', icon: DollarSign },
  { id: 4, label: 'Cover Photo', icon: Upload },
];

const schema = z.object({
  title: z.string().min(3, 'Trip title must be at least 3 characters'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  destination_ids: z.array(z.string()).min(1, 'Select at least one destination'),
  estimated_budget: z.coerce.number().min(0, 'Budget must be a positive number'),
});

type FormData = z.infer<typeof schema>;

interface Destination {
  id: string;
  city_name: string;
  country: string;
  image_url: string | null;
  cost_index: number | null;
}

export function TripCreatorPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destSearch, setDestSearch] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, control, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { destination_ids: [], estimated_budget: 50000 },
  });

  const selectedDestIds = watch('destination_ids');
  const startDate = watch('start_date');
  const endDate = watch('end_date');

  useEffect(() => {
    const load = async () => {
      const query = supabase.from('destinations').select('id,city_name,country,image_url,cost_index').order('popularity_score', { ascending: false });
      const { data } = destSearch.length > 1
        ? await query.ilike('city_name', `%${destSearch}%`)
        : await query.limit(20);
      if (data) setDestinations(data);
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [destSearch]);

  const toggleDest = (id: string) => {
    const curr = selectedDestIds ?? [];
    const next = curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id];
    setValue('destination_ids', next);
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const nextStep = async () => {
    const fields: Record<number, (keyof FormData)[]> = {
      1: ['title', 'start_date', 'end_date'],
      2: ['destination_ids'],
      3: ['estimated_budget'],
    };
    const valid = await trigger(fields[step] as any);
    if (valid) setStep(s => s + 1);
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setSubmitting(true);
    setError('');
    try {
      let cover_image_url: string | null = null;

      // Upload cover image if provided
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('trip-covers').upload(path, coverFile);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('trip-covers').getPublicUrl(path);
          cover_image_url = urlData.publicUrl;
        }
      }

      // Create trip
      const { data: trip, error: tripErr } = await supabase
        .from('trips')
        .insert([{
          user_id: user.id,
          title: data.title,
          description: data.description,
          start_date: data.start_date,
          end_date: data.end_date,
          estimated_budget: data.estimated_budget,
          currency: 'INR',
          cover_image_url,
          is_public: false,
          public_slug: generateSlug(data.title),
        }])
        .select()
        .single();

      if (tripErr || !trip) throw new Error(tripErr?.message ?? 'Failed to create trip');

      // Create stops for each destination
      for (let i = 0; i < data.destination_ids.length; i++) {
        await supabase.from('trip_stops').insert([{
          trip_id: trip.id,
          destination_id: data.destination_ids[i],
          arrival_date: data.start_date,
          departure_date: data.end_date,
          stop_order: i + 1,
          transport_cost: 0,
          accommodation_cost: 0,
        }]);
      }

      navigate(`/trips/${trip.id}/builder`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-linen-100">
      <div className="max-w-3xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="section-label mb-2">New Journey</p>
          <h1 className="font-serif text-3xl font-bold text-ink-200">Plan Your Trip</h1>
        </div>

        {/* Step Progress */}
        <div className="flex items-center gap-0 mb-10">
          {steps.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300',
                  step > s.id ? 'bg-terracotta-500 border-terracotta-500 text-white' :
                  step === s.id ? 'bg-white border-terracotta-500 text-terracotta-500' :
                  'bg-white border-sand-300 text-sand-400'
                )}>
                  {step > s.id ? <Check size={16} /> : <s.icon size={16} />}
                </div>
                <p className={cn('text-xs mt-1.5 font-medium', step >= s.id ? 'text-terracotta-600' : 'text-sand-400')}>
                  {s.label}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5 mt-[-18px] mx-2 transition-all duration-500',
                  step > s.id ? 'bg-terracotta-500' : 'bg-sand-300'
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-dusty-50 border border-dusty-100 rounded-lg text-dusty-600 text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Core Details */}
          {step === 1 && (
            <div className="card animate-slide-up space-y-6">
              <div>
                <h2 className="font-serif text-xl font-semibold text-ink-200 mb-1">Trip Details</h2>
                <p className="text-sm text-sand-500">Give your journey a name and set travel dates</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="trip-title" className="label">Trip Title</label>
                <input
                  id="trip-title"
                  className="input"
                  placeholder="e.g., Temples & Tea of Kyoto"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-dusty-500">{errors.title.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="trip-start-date" className="label">Start Date</label>
                  <input id="trip-start-date" type="date" className="input" {...register('start_date')} />
                  {errors.start_date && <p className="text-xs text-dusty-500">{errors.start_date.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="trip-end-date" className="label">End Date</label>
                  <input
                    id="trip-end-date"
                    type="date"
                    className="input"
                    min={startDate}
                    {...register('end_date')}
                  />
                  {errors.end_date && <p className="text-xs text-dusty-500">{errors.end_date.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="trip-description" className="label">Description (optional)</label>
                <textarea
                  id="trip-description"
                  className="input min-h-[100px] resize-none"
                  placeholder="Describe your trip in a few words..."
                  {...register('description')}
                />
              </div>
            </div>
          )}

          {/* Step 2: Destination Select */}
          {step === 2 && (
            <div className="card animate-slide-up space-y-5">
              <div>
                <h2 className="font-serif text-xl font-semibold text-ink-200 mb-1">Select Destinations</h2>
                <p className="text-sm text-sand-500">Choose one or more cities for your journey</p>
              </div>

              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sand-400" />
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Search cities..."
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  id="trip-dest-search"
                />
              </div>

              {selectedDestIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedDestIds.map((id) => {
                    const d = destinations.find(x => x.id === id);
                    return d ? (
                      <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-terracotta-50 border border-terracotta-100 rounded-full text-sm text-terracotta-700 font-medium">
                        {d.city_name}
                        <button type="button" onClick={() => toggleDest(id)}>
                          <X size={13} className="hover:text-terracotta-500" />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}

              {errors.destination_ids && (
                <p className="text-xs text-dusty-500">{errors.destination_ids.message}</p>
              )}

              <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
                {destinations.map((dest) => {
                  const selected = selectedDestIds.includes(dest.id);
                  return (
                    <button
                      key={dest.id}
                      type="button"
                      id={`dest-select-${dest.id}`}
                      onClick={() => toggleDest(dest.id)}
                      className={cn(
                        'relative rounded-lg overflow-hidden h-28 text-left transition-all duration-200',
                        selected ? 'ring-2 ring-terracotta-500 scale-[0.98]' : 'hover:scale-[1.02]'
                      )}
                    >
                      <img
                        src={getDestinationImage(dest.city_name, dest.image_url)}
                        alt={dest.city_name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-200/80 to-transparent" />
                      {selected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-terracotta-500 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-3">
                        <p className="text-white text-sm font-semibold">{dest.city_name}</p>
                        <p className="text-white/60 text-xs">{dest.country}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Financial Target */}
          {step === 3 && (
            <div className="card animate-slide-up space-y-6">
              <div>
                <h2 className="font-serif text-xl font-semibold text-ink-200 mb-1">Set Your Budget</h2>
                <p className="text-sm text-sand-500">Define your overall trip spending limit in INR</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="trip-budget" className="label">Estimated Budget (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sand-500 font-semibold">₹</span>
                  <input
                    id="trip-budget"
                    type="number"
                    className="input pl-8"
                    placeholder="150000"
                    {...register('estimated_budget')}
                  />
                </div>
                {errors.estimated_budget && (
                  <p className="text-xs text-dusty-500">{errors.estimated_budget.message}</p>
                )}
              </div>

              <div className="p-4 bg-linen-200 border border-sand-300 rounded-lg space-y-1">
                <p className="text-xs text-sand-500 font-medium uppercase tracking-wider">Budget Preview</p>
                <p className="font-serif text-3xl font-bold text-ink-200">
                  {formatCurrency(watch('estimated_budget') || 0, 'INR')}
                </p>
                <p className="text-sm text-sand-500">for your trip</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[25000, 75000, 150000, 250000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    id={`budget-preset-${amt}`}
                    onClick={() => setValue('estimated_budget', amt)}
                    className={cn(
                      'p-3 rounded-lg border text-sm font-medium transition-all duration-150',
                      watch('estimated_budget') === amt
                        ? 'bg-terracotta-500 text-white border-terracotta-500'
                        : 'bg-white border-sand-300 text-ink-50 hover:border-terracotta-300'
                    )}
                  >
                    {formatCurrency(amt, 'INR')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Cover Photo */}
          {step === 4 && (
            <div className="card animate-slide-up space-y-6">
              <div>
                <h2 className="font-serif text-xl font-semibold text-ink-200 mb-1">Trip Cover Photo</h2>
                <p className="text-sm text-sand-500">Upload a photo that captures your journey's spirit</p>
              </div>

              <label
                htmlFor="cover-upload"
                id="cover-upload-area"
                className={cn(
                  'block border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 overflow-hidden',
                  coverPreview ? 'border-transparent' : 'border-sand-300 hover:border-terracotta-300 p-12 text-center'
                )}
              >
                {coverPreview ? (
                  <div className="relative h-64">
                    <img src={coverPreview} alt="Cover preview" className="w-full h-full object-cover rounded-xl" />
                    <div className="absolute inset-0 bg-ink-200/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                      <p className="text-white font-semibold text-sm">Click to change</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={32} className="mx-auto text-sand-400 mb-3" />
                    <p className="text-sm font-semibold text-ink-50">Drag & drop or click to upload</p>
                    <p className="text-xs text-sand-400 mt-1">PNG, JPG up to 10MB</p>
                  </>
                )}
                <input
                  id="cover-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverChange}
                />
              </label>

              <p className="text-xs text-sand-400 text-center">
                Skip this step to use a default travel illustration
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => setStep(s => Math.max(1, s - 1))}
              className={cn('btn-secondary', step === 1 && 'invisible')}
            >
              ← Back
            </button>

            {step < 4 ? (
              <button type="button" onClick={nextStep} className="btn-primary" id="trip-creator-next-btn">
                Next Step <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                id="trip-creator-submit-btn"
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {submitting ? 'Creating...' : 'Create Trip'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
