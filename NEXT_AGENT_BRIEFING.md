# Next Agent Briefing - Yachy App

**Date:** February 18, 2026  
**Session Focus:** Watch Keeping (Export, Edit/Delete, Rules, PDF), Shopping List (full feature), UX fixes  
**Status:** ✅ Session complete — Watch Keeping has Export/edit/delete and Rules; Shopping List is live with department filter and bullet lists.

---

## 📋 SESSION SUMMARY

### What Was Built / Fixed (Completed ✅)

1. **Watch Keeping – Export & Edit/Delete**
   - **Removed:** Publish button from the timetable modal.
   - **Added:** **Export** button in timetable modal → date picker overlay (inside same modal) → saves to `watch_keeping_timetables` and navigates to Watch Schedule. **Edit** and **Delete** in Watch Schedule view modal (HOD only).
   - **CreateWatchTimetableScreen** supports **edit mode** via route param `timetableId`; pre-fills form and uses `update()` instead of `publish()`.

2. **Watch Keeping Rules**
   - New section **above** the Watch Schedule button on the Watch Keeping hub (same card style as Coming Soon on Home).
   - **HOD:** can tap **Edit** to open modal, change rules text, Save. **Crew:** view only.
   - Table: `watch_keeping_rules` (one row per vessel: `vessel_id`, `content`, `updated_at`, `updated_by`). Migration: `CREATE_WATCH_KEEPING_RULES_TABLE.sql`.

3. **Watch Schedule PDF**
   - **Portrait** layout (595×842). **30 slots per page**; page breaks so content continues to next page (no blank/skipped pages). **Position | Crew | Time** columns; borders simplified to avoid solid black line. Date display uses **local date** (no timezone shift) via `formatLocalDateString` in `src/utils/index.ts`.

4. **Shopping List (full feature)**
   - **ShoppingListScreen:** Department filter (All / Bridge / Engineering / Exterior / Interior / Galley), **Create** button at top, list of cards (title + department badge + bullet items). Tap card to edit.
   - **AddEditShoppingListScreen:** Title, Department (on create), **Items** as bullet rows with **+ Add item** button **underneath the list** (follows down as items are added). Remove per row; Save.
   - Table: `shopping_lists` (`vessel_id`, `department`, `title`, `items` JSONB). Migration: `CREATE_SHOPPING_LISTS_TABLE.sql`. Service: `src/services/shoppingLists.ts`.
   - **Home:** Shopping List shortcut (🛒) added; **Coming Soon** now shows only Inventory and AI Chat Bot.

5. **Fixes**
   - **useFocusEffect:** Effect must not return a Promise. Use `() => { loadData(); }` not `() => loadData()` when `loadData` is async (fixed in AddEditShoppingListScreen, ShoppingListScreen).
   - **Date in app/PDF:** `formatLocalDateString(dateStr, options)` and `parseLocalDate(dateStr)` in `src/utils/index.ts` parse `YYYY-MM-DD` as local date to avoid “day before” in timezones behind UTC.

---

## 🗄️ DATABASE

### Tables (run migrations in Supabase SQL Editor if missing)

| Table                      | Purpose                                                      |
|----------------------------|--------------------------------------------------------------|
| `watch_keeping_timetables` | Published timetables (vessel_id, for_date, slots JSONB, etc.) |
| `watch_keeping_rules`      | One row per vessel: content (text), updated_at, updated_by  |
| `shopping_lists`          | Per vessel/department: title, items (JSONB array of strings) |

**Migrations:**  
- `CREATE_WATCH_KEEPING_TIMETABLES_TABLE.sql`  
- `CREATE_WATCH_KEEPING_RULES_TABLE.sql`  
- `CREATE_SHOPPING_LISTS_TABLE.sql`  

### Department constraint (users)

| Table   | Constraint                 | Allowed values                                  |
|---------|----------------------------|-------------------------------------------------|
| `users` | `users_department_check`   | `'BRIDGE', 'ENGINEERING', 'EXTERIOR', 'INTERIOR', 'GALLEY'` |

---

## 📂 KEY FILES

### Watch Keeping
- `src/screens/WatchKeepingScreen.tsx` – Hub: Watch Keeping Rules (view/Edit) + Watch Schedule + Create buttons.
- `src/screens/WatchScheduleScreen.tsx` – List of timetables; view modal with Export PDF, Edit, Delete (HOD).
- `src/screens/CreateWatchTimetableScreen.tsx` – Create/edit form; Generate; Export/Update modal (date overlay).
- `src/services/watchKeeping.ts` – Timetables: getByVessel, publish, update, delete, getById. Rules: getRules, upsertRules.

### Shopping List
- `src/screens/ShoppingListScreen.tsx` – Department filter, Create button, list of shopping list cards.
- `src/screens/AddEditShoppingListScreen.tsx` – Title, Department (create only), Items (bullet rows), “+ Add item” under list.
- `src/services/shoppingLists.ts` – getByVessel, create, update, delete.

### Shared
- `src/utils/index.ts` – `formatLocalDateString`, `parseLocalDate` for YYYY-MM-DD display without timezone shift.
- `src/navigation/RootNavigator.tsx` – Routes include WatchKeeping, WatchSchedule, CreateWatchTimetable, ShoppingList, AddEditShoppingList.
- `src/screens/index.ts` – Exports all screens.

### Other
- `expo-file-system/legacy` for FileSystem; `SIZES.bottomScrollPadding` for scroll clearance.

---

## 🔄 FLOWS

### Watch Keeping
1. **Hub** – Rules (view / HOD Edit) → Watch Schedule → Create.
2. **Watch Schedule** – Load timetables; tap card → view modal → Export as PDF, Edit (→ Create screen), Delete.
3. **Create** – Form → Generate → Export (pick date) → save and go to Watch Schedule. Edit mode: pre-filled form → Update.

### Shopping List
1. **Home** → Shopping List (🛒).
2. **Shopping List** – Department filter, Create, then cards (title + dept + bullets). Tap card → edit.
3. **Add/Edit** – Title, Department (create), Items with “+ Add item” under the list → Save.

---

## ⚠️ NOTES

1. **RLS:** Watch Keeping and Shopping List tables use permissive policies; consider tightening for production.
2. **useFocusEffect:** Never return a Promise from the callback; call async functions inside the callback without returning them.
3. **PDF:** Portrait, 30 rows per page, `page-break-after`; no `min-height` on page divs to avoid blank pages.

---

## 🎯 SUGGESTED NEXT STEPS

1. **Inventory** – Categories and items by department (PROJECT_SPEC).
2. **AI Chat Bot** – Per Coming Soon / PROJECT_SPEC.
3. **Watch duties checklist** – Extend Watch Keeping if needed.
4. **App performance** – Lazy-load heavy screens.

---

## 🔧 QUICK REFERENCE

### Commands
```bash
cd "/Users/clintonhandford/Desktop/Yachy App/yachy-app"
npm start
npx tsc --noEmit   # TypeScript check
```

### Navigation
- Home → Watch Keeping → Watch Schedule | Create | (Rules at top)
- Home → Shopping List → Create | (filter by department) | tap card → AddEditShoppingList
- Watch Schedule view modal → Edit → CreateWatchTimetable (edit mode)

### Migrations to run (if not applied)
- `CREATE_WATCH_KEEPING_TIMETABLES_TABLE.sql`
- `CREATE_WATCH_KEEPING_RULES_TABLE.sql`
- `CREATE_SHOPPING_LISTS_TABLE.sql`
- `UPDATE_USERS_DEPARTMENT_CHECK.sql` (department constraint)

---

## 🔒 QUALITY CONTROL GATES (Start of Each Agent Session)

1. **Gate 1:** `npx tsc --noEmit` – TypeScript must pass.
2. **Gate 2:** `npm start` – App must start.
3. **Gate 3:** Critical screens (Login, Home, Tasks, Watch Keeping, Shopping List) load without crash.

---

**Next agent:** Use PROJECT_SPEC for Inventory and AI Chat Bot. Keep department values and scroll padding consistent. Ensure `watch_keeping_timetables`, `watch_keeping_rules`, and `shopping_lists` exist in Supabase when testing those features.
