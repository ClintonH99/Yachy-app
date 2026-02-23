# Next Agent Briefing - Nautical Ops

**Date:** February 23, 2026  
**Session Focus:** Inventory PDF export polish, Import/Export screen — Inventory section (Download Template + Import from File), Excel template with department tabs, DB constraint fix.  
**Status:** ✅ Session complete — All changes committed and pushed to GitHub (`main`).

---

## 📋 SESSION SUMMARY

### What Was Built / Fixed (Completed ✅)

---

### 1. Inventory PDF Export — Portrait & Page Breaks ✅
- **Always portrait:** `@page { size: A4 portrait; }` in the PDF HTML so the export is always portrait regardless of device settings.
- **Automatic page breaks:** Content flows to the next page naturally when the page is full. Each `.item` block has `page-break-inside: avoid` so an inventory entry never splits across two pages.
- **Header/footer space:** `@page` uses `margin-top: 22mm` and `margin-bottom: 22mm` to reserve clear space at the top and bottom of every page.

**File:** `src/utils/inventoryPdf.ts`

---

### 2. Inventory PDF — Filename ✅
- PDF is saved as: **`{Department}_{YYYY-MM-DD}_Inventory List.pdf`**
  - Single department selected → e.g. `Interior_2026-02-23_Inventory List.pdf`
  - Multiple departments → `Mixed_2026-02-23_Inventory List.pdf`
- Uses `expo-file-system` (`FileSystem.moveAsync`) to rename the temp file before sharing — same pattern as Watch Schedule and Maintenance Log.

**File:** `src/utils/inventoryPdf.ts`

---

### 3. Inventory PDF — Content Cleanup ✅
- **Removed:** The duplicate small "Inventory" text that appeared in the fixed header (lighter font, 11px).
- **Removed:** "X item(s) · Generated from Nautical Ops" line from the document body.
- **Removed:** "Generated from Nautical Ops" footer text and its top divider line.
- **Kept:** Single prominent `<h1>Inventory</h1>` at the top of the content so the document is clearly identified.

**File:** `src/utils/inventoryPdf.ts`

---

### 4. Import/Export Screen — Inventory Section ✅
A new **Inventory** card was added to the bottom of the Import/Export screen (`src/screens/ImportExportScreen.tsx`), with:

| Button | Action |
|---|---|
| **Download Template** | Generates and shares an `.xlsx` file with 5 department tabs |
| **Import from File** | Picks a filled `.xlsx`, creates each row as an inventory item in Supabase, navigates to Inventory on success |

- Uses the existing `TemplateType` pattern (`'inventory'` added to the union).
- Import success alert has a **"Go to Inventory"** button (`navigation.navigate('Inventory')`).
- `InventoryScreen` uses `useFocusEffect` so it auto-reloads imported items when navigated to.

**Files:** `src/screens/ImportExportScreen.tsx`, `src/services/excelTemplates.ts`

---

### 5. Inventory Excel Template ✅
The template has **6 tabs**:

| Tab | Purpose |
|---|---|
| **Info Dump** | General instructions |
| **Bridge** | Bridge department items |
| **Engineering** | Engineering department items |
| **Exterior** | Exterior department items |
| **Interior** | Interior department items |
| **Galley** | Galley department items |

**Columns per tab:** `Title | Location | Description | Amount 1 | Item 1`

- **No Department column** — department is inferred from the sheet/tab name at import time (e.g. `'Interior'` → `'INTERIOR'`).
- **No example rows** — tabs are blank below the header so users fill in their own data.
- The parser (`parseInventoryFile`) reads all 5 department tabs, infers department from `sheetName.trim().toUpperCase()`, supports up to 10 Amount/Item column pairs per row for flexibility.

**File:** `src/services/excelTemplates.ts`

---

### 6. DB Department Constraint Fix ✅
**Error encountered:** `code: '23514'` — "new row for relation inventory_items violates check constraint inventory_items_department_check" when importing.

**Root cause:** The actual Supabase `inventory_items` table had a department check constraint with different or outdated values from what the app sends (uppercase: `'BRIDGE'`, `'ENGINEERING'`, etc.).

**Fixes applied:**
1. **SQL migration** — `supabase/migrations/FIX_INVENTORY_DEPARTMENT_CONSTRAINT.sql`:
   ```sql
   ALTER TABLE public.inventory_items
     DROP CONSTRAINT IF EXISTS inventory_items_department_check;
   ALTER TABLE public.inventory_items
     ADD CONSTRAINT inventory_items_department_check
     CHECK (department IN ('BRIDGE', 'ENGINEERING', 'EXTERIOR', 'INTERIOR', 'GALLEY'));
   ```
   ✅ Already run in Supabase — confirmed working.

2. **Code-level defence** — The import loop explicitly normalises the department to uppercase before calling `inventoryService.create()`, with a fallback to `'INTERIOR'` for any unrecognised values.

3. **Better error message** — If the constraint error recurs, the import now catches error code `23514` and shows a user-friendly message pointing to the SQL fix.

**Files:** `supabase/migrations/FIX_INVENTORY_DEPARTMENT_CONSTRAINT.sql`, `src/screens/ImportExportScreen.tsx`

---

## 🗄️ DATABASE

### Tables

| Table | Purpose |
|---|---|
| `inventory_items` | Per vessel/department: id, vessel_id, department, title, description, location, items (JSONB: `{amount,item}[]`), name (legacy NOT NULL), last_edited_by_name, created_at |

### Department Constraint

| Table | Constraint | Allowed values |
|---|---|---|
| `inventory_items` | `inventory_items_department_check` | `'BRIDGE', 'ENGINEERING', 'EXTERIOR', 'INTERIOR', 'GALLEY'` |
| `users` | `users_department_check` | `'BRIDGE', 'ENGINEERING', 'EXTERIOR', 'INTERIOR', 'GALLEY'` |

### Migrations (run in Supabase SQL Editor if needed)

| File | When to run |
|---|---|
| `CREATE_INVENTORY_ITEMS_TABLE.sql` | If table doesn't exist |
| `FIX_INVENTORY_DEPARTMENT_CONSTRAINT.sql` | ✅ Already run — fixes department check constraint |

---

## 📂 KEY FILES

### Inventory PDF
- **`src/utils/inventoryPdf.ts`** — `buildInventoryHtml()` (A4 portrait CSS, page breaks, h1 title) + `exportInventoryToPdf()` (print → rename via FileSystem → share). Filename logic: `getInventoryPdfFilename()`.

### Import/Export
- **`src/screens/ImportExportScreen.tsx`** — Inventory card: Download Template, Import from File. Import handler normalises department, calls `inventoryService.create()` per row, shows "Go to Inventory" on success.
- **`src/services/excelTemplates.ts`** — `TemplateType` includes `'inventory'`. `createInventoryWorkbook()` creates 5-tab workbook. `parseInventoryFile()` reads all tabs, infers department from sheet name. `getDataSheetNames('inventory')` returns `['Bridge', 'Engineering', 'Exterior', 'Interior', 'Galley']`.

### Inventory Service
- **`src/services/inventory.ts`** — `getByVessel`, `create`, `update`. `create()` sends: `vessel_id`, `department` (normalised), `title`, `name` (legacy), `description`, `location`, `items`, `last_edited_by_name`.

### Inventory Screen
- **`src/screens/InventoryScreen.tsx`** — Department filter dropdown, card list, Export to PDF (select mode), `useFocusEffect` reload. Navigates to `AddEditInventoryItem`.
- **`src/screens/AddEditInventoryItemScreen.tsx`** — Department chips, Title/Location/Description, Amount|Item table, Create/Save.

---

## 🔄 FLOWS

### Inventory — Manual Create
1. **Home** → Inventory (📦)
2. **Inventory Screen** → Create → **AddEditInventoryItem** (department chip, Title, Location, Description, Amount|Item rows) → Save
3. Inventory screen reloads on focus via `useFocusEffect`

### Inventory — Export to PDF
1. **Inventory Screen** → "Export to PDF" (toggles selection mode)
2. Tap items to select → "Export selected (N)" → PDF generated → share sheet opens
3. Filename: `Interior_2026-02-23_Inventory List.pdf` (or `Mixed_...` if multiple departments)

### Inventory — Import from Excel
1. **Home** → Import / Export → **Inventory** card → "Download Template"
2. Fill in data in any/all department tabs (Bridge, Engineering, Exterior, Interior, Galley)
3. "Import from File" → pick filled `.xlsx` → items created in Supabase per tab
4. Alert: "X inventory item(s) imported successfully" → tap "Go to Inventory" → items appear

### Import/Export full list
- **Tasks** — Download template (3 tabs: Daily/Weekly/Monthly) + import
- **Maintenance Log** — Download + import
- **Yard Period** — Download + import
- **Inventory** — Download template (5 dept tabs) + import ← NEW

---

## ⚠️ IMPORTANT NOTES

1. **`inventory_items` actual schema** — The real Supabase table has more columns than the migration shows: `name` (NOT NULL legacy), `last_edited_by_name`, possibly `last_edited_by` (nullable). The service handles all of these. The migration file is not a complete reflection of the real schema.

2. **Department constraint** — Always use uppercase: `'BRIDGE'`, `'ENGINEERING'`, `'EXTERIOR'`, `'INTERIOR'`, `'GALLEY'`. The `normalizeDepartment()` function in `inventory.ts` enforces this. The DB constraint was fixed to accept uppercase (migration already run).

3. **Import sheet fallback** — If a user imports a non-standard `.xlsx` file (not our template), `parseFile` falls back to the first non-"Info Dump" sheet. The sheet name becomes the department source. If unrecognised, defaults to `'INTERIOR'`.

4. **`parseFile` sheetName param** — The 4th parameter `sheetName: string` was added to the `mapRow` callback in `parseFile`. Existing callers (tasks/maintenance/yard) use 3-param lambdas — this is fine in JS/TS (extra args are silently ignored).

5. **`useFocusEffect`** — Must NOT return a Promise. Always call `async` logic inside without returning it.

6. **Department colors** — Stored in AsyncStorage (`nautical_ops_department_color_overrides`). Loaded on auth in `RootNavigator`. Use `getDepartmentColor(dept, overrides)` from the store everywhere.

---

## 🎯 SUGGESTED NEXT STEPS

1. **AI Chat Bot** — Per PROJECT_SPEC.
2. **Inventory search/filter** — Search by title or location within the inventory screen.
3. **Inventory delete** — A delete button on the AddEditInventoryItemScreen.
4. **Export multiple departments** — Allow exporting all inventory filtered by multiple departments to a single PDF.
5. **RLS tightening** — Production-ready row-level security policies.
6. **Import for other features** — Apply same import pattern to other data types.

---

## 🔧 QUICK REFERENCE

### Commands
```bash
cd "/Users/clintonhandford/Desktop/Yachy App/yachy-app"
npm start
npx tsc --noEmit   # TypeScript check
```

### Navigation Routes
- `Inventory` — Main inventory list (department filter, export mode)
- `AddEditInventoryItem` — Create/edit form (params: `{ itemId?: string }`)
- `ImportExport` — Import/Export screen (Tasks, Maintenance, Yard, Inventory)
- `DepartmentColorSettings` — Per-department colour picker

### Git
- **Repo:** https://github.com/ClintonH99/Yachy-app.git
- **Branch:** `main`
- **Last commit:** `83066e7` — Inventory Import/Export: 5-tab department template, remove examples, fix department constraint error

### Migrations to run (if not applied)
- `CREATE_INVENTORY_ITEMS_TABLE.sql` — base table (if missing)
- ✅ `FIX_INVENTORY_DEPARTMENT_CONSTRAINT.sql` — already run, constraint fixed

---

## 🔒 QUALITY CONTROL GATES (Start of Each Agent Session)

1. **Gate 1:** `npx tsc --noEmit` — TypeScript must pass with no errors.
2. **Gate 2:** `npm start` — App must start cleanly.
3. **Gate 3:** Critical screens load without crash: Login, Home, Inventory, Import/Export, Tasks, Watch Keeping, Shopping List.

---

**Next agent:** The Inventory feature is complete end-to-end (create, edit, export to PDF, download template, import from Excel). Department values are always uppercase. Use `PROJECT_SPEC.md` for further features. Keep `SIZES.bottomScrollPadding` on all scrollable screens and `getDepartmentColor()` for all department badges.
