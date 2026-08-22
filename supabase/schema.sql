-- ═══════════════════════════════════════════════════════
--  GlobeTrotter — PostgreSQL Schema for Supabase
--  Run this entire block in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    full_name text,
    avatar_url text,
    preferences jsonb default '{"language": "en", "currency": "INR"}'::jsonb,
    saved_destinations uuid[] default '{}'::uuid[],
    is_admin boolean default false not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. DESTINATIONS TABLE
create table public.destinations (
    id uuid default uuid_generate_v4() primary key,
    city_name text not null,
    country text not null,
    country_code text,
    region text,
    description text,
    image_url text,
    cost_index integer check (cost_index between 1 and 5),
    popularity_score integer check (popularity_score between 1 and 100),
    latitude numeric(9,6),
    longitude numeric(9,6),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. TRIPS TABLE
create table public.trips (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    description text,
    cover_image_url text,
    start_date date not null,
    end_date date not null,
    estimated_budget numeric(12, 2) default 0.00,
    currency text default 'INR' not null,
    is_public boolean default false not null,
    public_slug text unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TRIP STOPS TABLE
create table public.trip_stops (
    id uuid default uuid_generate_v4() primary key,
    trip_id uuid references public.trips(id) on delete cascade not null,
    destination_id uuid references public.destinations(id) on delete restrict not null,
    arrival_date date not null,
    departure_date date not null,
    stop_order integer not null,
    notes text,
    transport_cost numeric(10, 2) default 0.00 not null,
    accommodation_cost numeric(10, 2) default 0.00 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_trip_stop_order unique (trip_id, stop_order)
);

-- 5. ACTIVITIES TABLE
create table public.activities (
    id uuid default uuid_generate_v4() primary key,
    destination_id uuid references public.destinations(id) on delete cascade not null,
    name text not null,
    description text,
    category text not null,
    duration_minutes integer default 60,
    estimated_cost numeric(10, 2) default 0.00 not null,
    currency text default 'INR' not null,
    image_url text,
    popularity_score integer check (popularity_score between 1 and 100),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ITINERARY ACTIVITIES TABLE
create table public.itinerary_activities (
    id uuid default uuid_generate_v4() primary key,
    trip_stop_id uuid references public.trip_stops(id) on delete cascade not null,
    activity_id uuid references public.activities(id) on delete restrict,
    activity_date date not null,
    start_time time without time zone,
    end_time time without time zone,
    custom_cost numeric(10, 2) default 0.00 not null,
    notes text,
    activity_order integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. EXPENSES TABLE
create table public.expenses (
    id uuid default uuid_generate_v4() primary key,
    trip_id uuid references public.trips(id) on delete cascade not null,
    trip_stop_id uuid references public.trip_stops(id) on delete set null,
    category text not null check (category in ('transport', 'accommodation', 'activities', 'meals', 'other')),
    amount numeric(12, 2) default 0.00 not null,
    currency text default 'INR' not null,
    expense_date date,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. TRIP SHARES TABLE
create table public.trip_shares (
    id uuid default uuid_generate_v4() primary key,
    trip_id uuid references public.trips(id) on delete cascade not null,
    share_token text not null unique,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.destinations enable row level security;
alter table public.trips enable row level security;
alter table public.trip_stops enable row level security;
alter table public.activities enable row level security;
alter table public.itinerary_activities enable row level security;
alter table public.expenses enable row level security;

-- RLS Policies
create policy "Allow read access to everyone for reference tables" on public.destinations for select using (true);
create policy "Allow read access to everyone for public activities" on public.activities for select using (true);

create policy "Profiles are viewable and updatable by owners only" on public.profiles
    for all using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
    for select using (
        exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );

create policy "Users can crud their own trips" on public.trips
    for all using (auth.uid() = user_id);

create policy "Admins can view all trips" on public.trips
    for select using (
        exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );

create policy "Anyone can select public trips" on public.trips
    for select using (is_public = true);

create policy "Users can crud stops for their own trips" on public.trip_stops
    for all using (
        exists (select 1 from public.trips where trips.id = trip_stops.trip_id and trips.user_id = auth.uid())
    );

create policy "Admins can view all stops" on public.trip_stops
    for select using (
        exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
    );

create policy "Anyone can select stops for public trips" on public.trip_stops
    for select using (
        exists (select 1 from public.trips where trips.id = trip_stops.trip_id and trips.is_public = true)
    );

create policy "Users can crud itinerary activities for their trips" on public.itinerary_activities
    for all using (
        exists (
            select 1 from public.trip_stops
            join public.trips on trips.id = trip_stops.trip_id
            where trip_stops.id = itinerary_activities.trip_stop_id and trips.user_id = auth.uid()
        )
    );

create policy "Anyone can select itinerary activities for public trips" on public.itinerary_activities
    for select using (
        exists (
            select 1 from public.trip_stops
            join public.trips on trips.id = trip_stops.trip_id
            where trip_stops.id = itinerary_activities.trip_stop_id and trips.is_public = true
        )
    );

create policy "Users can crud expenses for their own trips" on public.expenses
    for all using (
        exists (select 1 from public.trips where trips.id = expenses.trip_id and trips.user_id = auth.uid())
    );

-- Auto-create profile trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, full_name, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', 'Trotter Guest'),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ══════════════════════════════════════
-- SEED DATA — Popular Destinations
-- ══════════════════════════════════════
insert into public.destinations (city_name, country, country_code, region, description, cost_index, popularity_score, latitude, longitude) values
('Tokyo', 'Japan', 'JP', 'Asia', 'A dazzling metropolis blending ultramodern skyscrapers with historic temples, world-class cuisine, and vibrant street culture.', 3, 98, 35.689487, 139.691706),
('Paris', 'France', 'FR', 'Europe', 'The city of lights enchants with iconic landmarks, world-renowned cuisine, art museums, and romantic boulevards.', 4, 96, 48.856613, 2.352222),
('Bali', 'Indonesia', 'ID', 'Asia', 'A tropical paradise of terraced rice fields, ancient temples, surf beaches, and spiritual culture.', 2, 94, -8.340539, 115.091949),
('Rome', 'Italy', 'IT', 'Europe', 'The Eternal City overflows with millennia of history—from the Colosseum to Vatican City—set against incredible food.', 3, 92, 41.902782, 12.496366),
('New York', 'USA', 'US', 'Americas', 'The city that never sleeps offers towering skyscrapers, world-class museums, Broadway shows, and every cuisine imaginable.', 5, 95, 40.712776, -74.005974),
('London', 'UK', 'GB', 'Europe', 'A global capital rich in royal history, iconic red buses, remarkable museums, and a vibrant multicultural food scene.', 4, 93, 51.507351, -0.127758),
('Barcelona', 'Spain', 'ES', 'Europe', 'Gaudí''s architectural masterpieces, sandy beaches, tapas culture, and electric nightlife make Barcelona utterly unique.', 3, 91, 41.385063, 2.173404),
('Amsterdam', 'Netherlands', 'NL', 'Europe', 'A city of canals, world-class cycling culture, tulip markets, and extraordinary art museums like the Rijksmuseum.', 4, 88, 52.370216, 4.895168),
('Dubai', 'UAE', 'AE', 'Middle East', 'A gleaming desert oasis of record-breaking architecture, luxury malls, desert safaris, and futuristic city planning.', 5, 89, 25.204849, 55.270783),
('Singapore', 'Singapore', 'SG', 'Asia', 'A clean, green, ultra-modern city-state famous for its food hawker culture, Gardens by the Bay, and Sentosa Island.', 4, 87, 1.352083, 103.819836),
('Kyoto', 'Japan', 'JP', 'Asia', 'Japan''s cultural heartland with hundreds of classical temples, geisha districts, bamboo forests, and matcha everything.', 3, 90, 35.011564, 135.768149),
('Istanbul', 'Turkey', 'TR', 'Europe/Asia', 'A mesmerizing city straddling two continents, offering Ottoman palaces, bustling bazaars, and the Bosphorus strait.', 2, 85, 41.008240, 28.978359),
('Santorini', 'Greece', 'GR', 'Europe', 'Dramatic volcanic cliffs, whitewashed villages, blue-domed churches, and spectacular sunsets over the caldera.', 4, 88, 36.393154, 25.461320),
('Machu Picchu', 'Peru', 'PE', 'Americas', 'The ancient Incan citadel perched high in the Andes—one of the world''s most breathtaking archaeological sites.', 2, 86, -13.163141, -72.544963),
('Cape Town', 'South Africa', 'ZA', 'Africa', 'Where mountains meet ocean: Table Mountain, Cape Peninsula, world-class wine estates, and incredible biodiversity.', 2, 83, -33.924870, 18.424055),
('Maldives', 'Maldives', 'MV', 'Asia', 'The ultimate overwater bungalow escape—turquoise lagoons, pristine coral reefs, and unmatched tropical luxury.', 5, 84, 3.202778, 73.220680),
('New Delhi', 'India', 'IN', 'Asia', 'India''s capital is a sensory explosion of Mughal monuments, street food, busy markets, and ancient spiritual sites.', 1, 80, 28.613939, 77.209021),
('Goa', 'India', 'IN', 'Asia', 'India''s beloved beach state—palm-fringed shores, Portuguese heritage, seafood shacks, and vibrant nightlife.', 1, 82, 15.491997, 73.827972),
('Rajasthan', 'India', 'IN', 'Asia', 'The "Land of Kings" dazzles with magnificent forts, painted havelis, camel safaris, and vivid folk traditions.', 1, 81, 27.022805, 74.217933),
('Kerala', 'India', 'IN', 'Asia', 'Backwaters, houseboat cruises, elephant sanctuaries, spice gardens, and Ayurvedic wellness define Kerala.', 1, 79, 10.850516, 76.271080);

-- Create Supabase Storage buckets (run separately in Dashboard or via API)
-- Bucket: trip-covers (public)
-- Bucket: avatars (public)

-- ══════════════════════════════════════
-- SEED DATA — Popular Activities
-- ══════════════════════════════════════
insert into public.activities (destination_id, name, description, category, duration_minutes, estimated_cost, currency, popularity_score) 
select id, 'Tsukiji Outer Market Food Tour', 'Explore the historic outer market and taste fresh sushi, tamagoyaki, and street food.', 'Food', 180, 5000, 'JPY', 95
from public.destinations where city_name = 'Tokyo';

insert into public.activities (destination_id, name, description, category, duration_minutes, estimated_cost, currency, popularity_score) 
select id, 'Eiffel Tower Summit Access', 'Skip the line and go straight to the top of the iconic Eiffel Tower for panoramic views of Paris.', 'Sightseeing', 120, 30, 'EUR', 98
from public.destinations where city_name = 'Paris';

insert into public.activities (destination_id, name, description, category, duration_minutes, estimated_cost, currency, popularity_score) 
select id, 'Louvre Museum Guided Tour', 'Discover the Mona Lisa and Venus de Milo with an expert art historian.', 'Culture', 180, 50, 'EUR', 94
from public.destinations where city_name = 'Paris';

insert into public.activities (destination_id, name, description, category, duration_minutes, estimated_cost, currency, popularity_score) 
select id, 'Mount Batur Sunrise Trek', 'Hike up an active volcano in the dark to witness a spectacular sunrise over Lake Batur.', 'Adventure', 240, 500000, 'IDR', 91
from public.destinations where city_name = 'Bali';

insert into public.activities (destination_id, name, description, category, duration_minutes, estimated_cost, currency, popularity_score) 
select id, 'Ubud Sacred Monkey Forest', 'Walk through a lush jungle sanctuary home to hundreds of playful Balinese macaques.', 'Nature', 90, 80000, 'IDR', 89
from public.destinations where city_name = 'Bali';

insert into public.activities (destination_id, name, description, category, duration_minutes, estimated_cost, currency, popularity_score) 
select id, 'Colosseum Underground Tour', 'Step into the gladiator arena and explore the restricted underground chambers of the Colosseum.', 'Sightseeing', 150, 45, 'EUR', 97
from public.destinations where city_name = 'Rome';

insert into public.activities (destination_id, name, description, category, duration_minutes, estimated_cost, currency, popularity_score) 
select id, 'Central Park Bike Rental', 'Cycle through the iconic Central Park and visit Bethesda Terrace and Strawberry Fields.', 'Nature', 120, 25, 'USD', 90
from public.destinations where city_name = 'New York';

insert into public.activities (destination_id, name, description, category, duration_minutes, estimated_cost, currency, popularity_score) 
select id, 'Broadway Show Ticket', 'Experience the magic of New York theater with a ticket to a top Broadway musical.', 'Entertainment', 150, 150, 'USD', 96
from public.destinations where city_name = 'New York';

insert into public.activities (destination_id, name, description, category, duration_minutes, estimated_cost, currency, popularity_score) 
select id, 'Tower of London Tour', 'See the Crown Jewels and learn the bloody history of the Tower from a Yeoman Warder.', 'Culture', 150, 33, 'GBP', 92
from public.destinations where city_name = 'London';
