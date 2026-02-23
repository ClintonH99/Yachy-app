# Next Agent Briefing - Nautical Ops

**Date:** February 18, 2026  
**Session Focus:** Rebrand to Nautical Ops, Home/Settings/Inventory/Department colors, Shopping List checkboxes, Watch/crew fixes, Inventory (department → Create New → Title/Description/Location + Amount/Item table).  
**Status:** ✅ Session complete — App is Nautical Ops; Inventory flow live; department color settings; DB fixes for inventory_items.

---

## 📋 SESSION SUMMARY

### What Was Built / Fixed (Completed ✅)

1. **Rebrand to Nautical Ops**
   - **app.json:** `name`: "Nautical Ops", `slug`: "nautical-ops".
   - **User-facing:** Login hero, Settings version text, Vessel/Create share text, excel export filename, comments (App.tsx, types).
   - **package.json** name left as `yachy-app` for tooling.

2. **Login Screen**
   - Maritime-themed redesign: deep navy background, hero (logo mark, app name, tagline "Operations for superyacht & maritime crews", horizon line), sign-in card (Title, Description, Location inputs; no strikethrough), captain/crew account cards.

3. **Home Screen**
   - **Header order:** Vessel name (top, largest) → User name → Department → Position; HOD as badge on same line as position. No Welcome, no emoji before vessel. Larger fonts than buttons.
   - **Removed:** Coming Soon section.
   - **Added:** Inventory shortcut (📦). Header/nav blend (background, no shadow); Home screen title empty.

4. **Settings & Crew**
   - **Department colors:** New App item "Department colors" → DepartmentColorSettingsScreen. Per-department color or "No color"; persisted in AsyncStorage; all department badges/accents use store (getDepartmentColor + overrides).
   - **Vessel Settings:** Description "Manage vessel name. Invite code is here."
   - **Crew Management:** Invite code section removed (use Vessel Settings). Vessel/Clipboard/Share/Button cleanup.

5. **Shopping List**
   - **Checkboxes:** Items are `{ text, checked }`. Tick on list cards and in Add/Edit; checked = green tick, strikethrough. Service: `ShoppingListItem`, normalize legacy string[].
   - **Department dropdown:** White background (no blue) on Shopping List and AddEditShoppingList.

6. **Inventory (full flow)**
   - **InventoryScreen:** Department buttons (Bridge, Engineering, Exterior, Interior, Galley) → navigate to Department Inventory.
   - **DepartmentInventoryScreen:** List of inventory items for that department + **Create New** button; tap item to edit.
   - **AddEditInventoryItemScreen:** **Title**, **Description**, **Location**; then table **Amount | Item** with rows; **+ Add New** under table (like Shopping List); Save/Create.
   - **Service:** `src/services/inventory.ts` — getByVesselAndDepartment, create, update, delete. `items` = JSONB array of `{ amount, item }`.
   - **DB:** Table `inventory_items` (vessel_id, department, title, description, location, items JSONB). Insert does **not** send `created_by` (column may be missing). If table was created without `items`, run **FIX_INVENTORY_ITEMS_MISSING_COLUMNS.sql** in Supabase.

7. **Watch Schedule**
   - View modal is single ScrollView (header + content + actions) so header is not stuck.
   - TypeScript fix: guard `data` in `.then()` callback (possibly undefined).

8. **Fixes**
   - **Title/Location/Amount/Item text:** Strikethrough removed — `Input` component and AddEditInventoryItemScreen `tableInput` use `textDecorationLine: 'none'`.
   - **Inventory DB:** Omit `created_by` from insert to avoid PGRST204 when column missing; use FIX_INVENTORY_ITEMS_MISSING_COLUMNS.sql to add `description`, `location`, `items` if missing.

---

## 🗄️ DATABASE

### Tables (run migrations in Supabase SQL Editor if missing)

| Table                      | Purpose                                                      |
|----------------------------|--------------------------------------------------------------|
| `watch_keeping_timetables` | Published timetables (vessel_id, for_date, slots JSONB, etc.) |
| `watch_keeping_rules`      | One row per vessel: content (text), updated_at, updated_by   |
| `shopping_lists`          | Per vessel/department: title, items (JSONB: { text, checked }[]) |
| `inventory_items`         | Per vessel/department: title, description, location, items (JSONB: { amount, item }[]) |

**Migrations:**
- `CREATE_WATCH_KEEPING_TIMETABLES_TABLE.sql`
- `CREATE_WATCH_KEEPING_RULES_TABLE.sql`
- `CREATE_SHOPPING_LISTS_TABLE.sql`
- `CREATE_INVENTORY_ITEMS_TABLE.sql` — full table; if table already exists without some columns, run:
- **`FIX_INVENTORY_ITEMS_MISSING_COLUMNS.sql`** — adds `title`, `description`, `location`, `items` if missing.
- `ADD_INVENTORY_ITEMS_CREATED_BY.sql` (optional) — add `created_by` if desired.

### Department constraint (users)

| Table   | Constraint                 | Allowed values                                  |
|---------|----------------------------|-------------------------------------------------|
| `users` | `users_department_check`   | `'BRIDGE', 'ENGINEERING', 'EXTERIOR', 'INTERIOR', 'GALLEY'` |

---

## 📂 KEY FILES

### Inventory
- `src/screens/InventoryScreen.tsx` — Department buttons; navigates to DepartmentInventory.
- `src/screens/DepartmentInventoryScreen.tsx` — List + Create New; tap item → AddEditInventoryItem.
- `src/screens/AddEditInventoryItemScreen.tsx` — Title, Description, Location; Amount | Item table; + Add New.
- `src/services/inventory.ts` — getByVesselAndDepartment, create, update, delete; no created_by in insert.

### Department colors
- `src/store/index.ts` — useDepartmentColorStore (overrides, loadOverrides, setOverride), getDepartmentColor(dept, overrides).
- `src/screens/DepartmentColorSettingsScreen.tsx` — Per-department color or No color; swatches + AsyncStorage.
- All department badges/accents use getDepartmentColor (Inventory, Shopping List, Crew Management, Yard Period, Tasks Calendar, AddEditYardJob).

### Watch Keeping
- `src/screens/WatchKeepingScreen.tsx`, `WatchScheduleScreen.tsx`, `CreateWatchTimetableScreen.tsx`, `src/services/watchKeeping.ts`.

### Shopping List
- `src/screens/ShoppingListScreen.tsx`, `AddEditShoppingListScreen.tsx`, `src/services/shoppingLists.ts` — items as ShoppingListItem[] (text, checked).

### Shared
- `src/utils/index.ts` — formatLocalDateString, parseLocalDate.
- `src/navigation/RootNavigator.tsx` — Routes: Inventory, DepartmentInventory, AddEditInventoryItem, DepartmentColorSettings; loadDepartmentColorOverrides when authenticated.
- `src/components/Input.tsx` — input style includes textDecorationLine: 'none'.

---

## 🔄 FLOWS

### Inventory
1. **Home** → Inventory (📦).
2. **Inventory** → tap department → **Department Inventory** (e.g. Bridge Inventory).
3. **Department Inventory** → **Create New** or tap item → **Add Edit Inventory Item** (Title, Description, Location, Amount/Item table, + Add New) → Save.

### Department colors
- **Settings** → Department colors → per-department color or No color; stored in AsyncStorage; used app-wide for department badges/accents.

### Shopping List
- List cards show checkboxes; tap to toggle. Add/Edit: same + Save. Items: `{ text, checked }`.

---

## ⚠️ NOTES

1. **inventory_items:** Ensure table has `title`, `description`, `location`, `items` (JSONB). If not, run FIX_INVENTORY_ITEMS_MISSING_COLUMNS.sql. App does not send `created_by`.
2. **useFocusEffect:** Callback must not return a Promise; call async logic inside without returning it.
3. **Department color overrides:** Loaded on auth in RootNavigator; persisted in AsyncStorage key `nautical_ops_department_color_overrides`.

---

## 🎯 SUGGESTED NEXT STEPS

1. **AI Chat Bot** — Per PROJECT_SPEC / prior Coming Soon (now removed from UI).
2. **Inventory enhancements** — Categories, search, or export if needed.
3. **RLS** — Tighten policies for production where still permissive.
4. **App performance** — Lazy-load heavy screens if needed.

---

## 🔧 QUICK REFERENCE

### Commands
```bash
cd "/Users/clintonhandford/Desktop/Yachy App/yachy-app"
npm start
npx tsc --noEmit   # TypeScript check
```

### Navigation
- Home → Inventory → (department) → Department Inventory → Create New | tap item → AddEditInventoryItem
- Settings → Department colors → per-department picker
- Home → Shopping List → Create | filter | tap card → AddEditShoppingList
- Watch Keeping → Watch Schedule | Create | Rules

### Migrations to run (if not applied)
- `CREATE_INVENTORY_ITEMS_TABLE.sql` (or ensure table exists)
- **`FIX_INVENTORY_ITEMS_MISSING_COLUMNS.sql`** if inventory_items missing `items`/description/location
- `ADD_INVENTORY_ITEMS_CREATED_BY.sql` (optional)

---

## 🔒 QUALITY CONTROL GATES (Start of Each Agent Session)

1. **Gate 1:** `npx tsc --noEmit` — TypeScript must pass.
2. **Gate 2:** `npm start` — App must start.
3. **Gate 3:** Critical screens (Login, Home, Tasks, Watch Keeping, Shopping List, Inventory) load without crash.

---

**Next agent:** Use PROJECT_SPEC for further features. Keep department values and scroll padding (SIZES.bottomScrollPadding) consistent. Ensure `inventory_items` has `items` (and description, location) in Supabase when testing Inventory.
