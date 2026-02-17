# Next Agent Briefing - Yachy App

**Date:** February 17, 2026  
**Session Focus:** Upcoming Trips (Guest, Boss, Delivery, Yard Period), Calendar, HOD-Editable Trip Colors, Show/Hide Filters  
**Status:** ✅ Feature-complete for this module — DB migrations may be required (see Database)

---

## 📋 SESSION SUMMARY

### What Was Built (Completed ✅)

1. **Upcoming Trips module**
   - **Upcoming Trips** screen: calendar (full-day colored cells) + four trip-type cards (Guest, Boss, Delivery, Yard Period).
   - **Guest Trips** / **Boss Trips** / **Delivery** / **Yard Period** list screens: HOD can add, edit, delete; crew can view.
   - **Add/Edit Trip** screen: calendar date range picker, title, notes; HOD-only create/edit.
   - Home: **Upcoming Trips** button and tappable stat card to open trips.

2. **Trip types**
   - **Guest Trips** (charter guests), **Boss Trips** (owner/family), **Delivery**, **Yard Period**.
   - Types stored in DB as `GUEST` | `BOSS` | `DELIVERY` | `YARD_PERIOD`.

3. **Calendar behavior**
   - Full-day colored cells (no dots); colors from vessel custom colors or theme defaults.
   - **Show/Hide** toggles on each trip-type card: tap **Hide** to remove that type from the calendar; tap **Show** to add it back. Legend only shows visible types. "Multiple" option removed; overlapping dates use first type’s color.

4. **HOD-editable trip colors**
   - **Trip Color Settings** screen: HOD picks from 12 swatches per type (Guest, Boss, Delivery, Yard Period). **Reset to defaults** button.
   - **Edit colors** header button on: Upcoming Trips, Guest Trips, Boss Trips, Delivery, Yard Period (HOD only).
   - Colors stored in `vessel_trip_colors` (per vessel). Used on calendar, legend, trip cards, and Add/Edit Trip accent.

5. **Services & data**
   - `src/services/trips.ts`: getTripsByVessel, getTripsByVesselAndType, createTrip, updateTrip, deleteTrip, getTripById.
   - `src/services/tripColors.ts`: getColors(vesselId), setColors(vesselId, updates). Graceful fallback when `vessel_trip_colors` table is missing (PGRST205 → defaults, no error overlay).
   - `src/hooks/useVesselTripColors.ts`: load vessel colors for calendar and list screens.

---

## 🗄️ DATABASE

### Tables

- **`trips`**  
  - Columns: `id`, `vessel_id`, `type` (GUEST|BOSS|DELIVERY|YARD_PERIOD), `title`, `start_date`, `end_date`, `notes`, `created_by`, `created_at`, `updated_at`.  
  - **New install:** run `supabase/migrations/CREATE_TRIPS_TABLE.sql` (includes all four types).  
  - **Existing `trips` with only GUEST/BOSS:** run `supabase/migrations/ADD_DELIVERY_YARD_PERIOD_TRIP_TYPES.sql` to allow DELIVERY and YARD_PERIOD.

- **`vessel_trip_colors`**  
  - One row per vessel: `vessel_id` (PK), `guest_trip_color`, `boss_trip_color`, `delivery_trip_color`, `yard_period_color`, `updated_at`.  
  - **Required for Edit colors:** run `supabase/migrations/CREATE_VESSEL_TRIP_COLORS_TABLE.sql`.  
  - If table is missing, app uses default theme colors and does not show error overlay.

### Prior context (users / RLS)

- If app had infinite recursion on load, user was instructed to run:  
  `DROP POLICY IF EXISTS "Users can view crew in their vessel" ON public.users;`  
  `ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;`  
- RLS may still be disabled on `users`; app filters by `vessel_id` in code.

---

## 📂 FILES (THIS SESSION)

### Screens
- `src/screens/UpcomingTripsScreen.tsx` — Calendar, legend (no "Multiple"), trip-type cards with Show/Hide, Edit colors (HOD).
- `src/screens/GuestTripsScreen.tsx`, `BossTripsScreen.tsx`, `DeliveryTripsScreen.tsx`, `YardPeriodTripsScreen.tsx` — List + Add + Edit colors (HOD).
- `src/screens/AddEditTripScreen.tsx` — Add/Edit trip; calendar range; uses vessel trip colors.
- `src/screens/TripColorSettingsScreen.tsx` — HOD trip color picker (swatches + reset).

### Services & hooks
- `src/services/trips.ts` — Trip CRUD.
- `src/services/tripColors.ts` — Vessel trip colors; handles missing table.
- `src/hooks/useVesselTripColors.ts` — Load colors + getTripTypeColorMap.

### Other
- `src/types/index.ts` — TripType extended with DELIVERY, YARD_PERIOD.
- `src/constants/theme.ts` — deliveryTripColor, yardPeriodColor, tripColorSwatches.
- `src/navigation/RootNavigator.tsx` — All trip and TripColorSettings routes.
- `src/screens/HomeScreen.tsx` — Upcoming Trips button/card.
- `supabase/migrations/` — CREATE_TRIPS_TABLE.sql, ADD_DELIVERY_YARD_PERIOD_TRIP_TYPES.sql, CREATE_VESSEL_TRIP_COLORS_TABLE.sql.

### Dependencies
- `react-native-calendars` — Calendar and period marking.

---

## ✅ WHAT'S WORKING

- Upcoming Trips: calendar with full-day colors; Guest/Boss/Delivery/Yard Period cards; Show/Hide per type; legend without "Multiple".
- Guest/Boss/Delivery/Yard Period lists: view, add, edit, delete (HOD); card border uses vessel color.
- Add/Edit Trip: date range on calendar, title, notes; accent color from vessel trip colors.
- Trip Color Settings: HOD can set colors per type; Edit colors on all five trip screens.
- Trip colors: used on calendar, legend, list cards, Add/Edit; defaults when `vessel_trip_colors` missing.

---

## ⚠️ KNOWN ISSUES / NOTES

1. **DB migrations**  
   User must run the SQL migrations in Supabase (trips, vessel_trip_colors, and if needed ADD_DELIVERY_YARD_PERIOD_TRIP_TYPES) for full functionality.

2. **RLS / users table**  
   If RLS was disabled to fix recursion, crew visibility in Crew Management relies on app-level filtering. Re-enabling RLS later needs a non-recursive policy.

3. **Profile photos**  
   Require `profile-photos` storage bucket (see SETUP_STORAGE.sql if present in repo).

---

## 🎯 SUGGESTED NEXT STEPS

1. **Tasks module** (from PROJECT_SPEC): create/assign tasks, deadlines, status, department.
2. **Inventory**: categories and items by department.
3. **Watch duties**: schedule and checklist (local checkboxes).
4. **General duties**: HOD-defined duty categories (Daily/Weekly/Monthly etc.).
5. **RLS**: design safe policies for users/trips/vessel_trip_colors when moving to production.

---

## 🔧 QUICK REFERENCE

### Key commands
```bash
cd "/Users/clintonhandford/Desktop/Yachy App/yachy-app"
npm start
```

### Supabase (run in SQL Editor if needed)
- Create trips table: `supabase/migrations/CREATE_TRIPS_TABLE.sql`
- Add Delivery/Yard to existing trips: `supabase/migrations/ADD_DELIVERY_YARD_PERIOD_TRIP_TYPES.sql`
- Create trip colors table: `supabase/migrations/CREATE_VESSEL_TRIP_COLORS_TABLE.sql`

### Navigation
- Home → Upcoming Trips → (Guest Trips | Boss Trips | Delivery | Yard Period) → list; Add/Edit Trip from list (HOD).
- Upcoming Trips or any trip list → **Edit colors** (HOD) → Trip Color Settings.

---

**Next agent:** Confirm DB migrations are applied if user reports missing tables or Edit colors not saving; then continue with Tasks or other modules from PROJECT_SPEC.
