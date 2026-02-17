# Next Agent Briefing - Yachy App

**Date:** February 17, 2026  
**Session Focus:** Upcoming Tasks, Maintenance Log (CRUD, PDF export, vessel-name filename), Home shortcut list  
**Status:** ✅ Feature-complete — DB migrations may be required (see Database)

---

## 📋 SESSION SUMMARY

### What Was Built (Completed ✅)

1. **Upcoming Tasks**
   - **Tasks** hub: "Upcoming Tasks" button (tasks due in next 3 days from Daily/Weekly/Monthly), "Overdue Tasks", then Daily, Weekly, Monthly categories.
   - **UpcomingTasksScreen**: List of tasks due within 3 days; mark complete, edit, delete (HOD). Same urgency colors and behaviour as category lists.

2. **Maintenance Log**
   - **Home**: New shortcut card "Maintenance Log" in vertical list with Tasks, Upcoming Trips, Yard Period, Settings.
   - **MaintenanceLogScreen**: Spreadsheet-style table (Equipment, Port/Stbd/NA, Serial #, Hrs, Hrs next, Service done, Notes, Done by, Date, Edit/Delete). Add Log, Download PDF.
   - **AddEditMaintenanceLogScreen**: Equipment, **Port / Starboard or NA**, Serial number, Hours of service, Hours at next service, What service done, Notes, Service done by (Crew/Contractor). Logs persist until manually deleted.
   - **PDF export**: Filename = `{VesselName}_{YYYY-MM-DD}_MaintenanceLog.pdf` (vessel name from crew’s assigned vessel). Uses expo-print, expo-sharing, expo-file-system/legacy (moveAsync for rename).

3. **Home Screen UX**
   - Shortcuts are a **vertical list** (one card per row): Tasks, Upcoming Trips, Maintenance Log, Yard Period, Settings.
   - Sign Out remains a button at bottom.

4. **Tasks hub**
   - Single screen: Create Task (HOD), Upcoming Tasks (button), Overdue Tasks (button), Daily, Weekly, Monthly cards.

---

## 🗄️ DATABASE

### Tables

| Table | Migration |
|-------|-----------|
| `trips` | CREATE_TRIPS_TABLE.sql, ADD_DELIVERY_YARD_PERIOD_TRIP_TYPES.sql |
| `vessel_trip_colors` | CREATE_VESSEL_TRIP_COLORS_TABLE.sql |
| `vessel_tasks` | CREATE_VESSEL_TASKS_TABLE.sql |
| `vessel_tasks` (recurring, completed_by) | ADD_TASK_COMPLETION_AND_RECURRING.sql |
| `yard_period_jobs` | CREATE_YARD_PERIOD_JOBS_TABLE.sql |
| `maintenance_logs` | CREATE_MAINTENANCE_LOGS_TABLE.sql |
| `maintenance_logs` (port_starboard_na) | ADD_MAINTENANCE_LOG_PORT_STARBOARD.sql (if table already existed) |

Run in Supabase SQL Editor as needed. New installs: run CREATE_* for each table. For existing `maintenance_logs`, run ADD_MAINTENANCE_LOG_PORT_STARBOARD.sql to add Port/Starboard/NA column.

---

## 📂 KEY FILES

### Screens
- `TasksScreen.tsx` — Hub: Create Task, Upcoming Tasks (button), Overdue (button), Daily/Weekly/Monthly.
- `TasksListScreen.tsx` — List per category; mark complete.
- `UpcomingTasksScreen.tsx` — Tasks due in 3 days (Daily/Weekly/Monthly).
- `AddEditTaskScreen.tsx` — Title, Notes, Done by Date, Recurring, category picker.
- `OverdueTasksScreen.tsx` — Overdue tasks list.
- `MaintenanceLogScreen.tsx` — Table of logs; Add Log, Download PDF (vessel name + date filename).
- `AddEditMaintenanceLogScreen.tsx` — Equipment, Port/Starboard or NA, Serial #, Hrs, Hrs next, What service done, Notes, Done by.
- `YardPeriodJobsScreen.tsx`, `AddEditYardJobScreen.tsx` — Yard jobs.
- `HomeScreen.tsx` — Vertical shortcut list (Tasks, Upcoming Trips, Maintenance Log, Yard Period, Settings); Sign Out.

### Services
- `vesselTasks.ts` — CRUD, getOverdueTasks, **getUpcomingTasks(vesselId, withinDays)**, markComplete, deleteCompletedTasksBefore.
- `maintenanceLogs.ts` — CRUD for maintenance_logs (persist until deleted).
- `yardJobs.ts` — CRUD, markComplete.
- `vessel.ts` — getVessel(vesselId) used for PDF filename.
- `taskUrgency.ts` — getTaskUrgencyColor.

### Migrations
- `CREATE_MAINTENANCE_LOGS_TABLE.sql`, `ADD_MAINTENANCE_LOG_PORT_STARBOARD.sql`
- (Others: vessel_tasks, yard_period_jobs, trips, etc.)

---

## ✅ WHAT'S WORKING

- Tasks: Upcoming (3 days), Overdue, Daily/Weekly/Monthly; Create Task; recurring; urgency colors; completed-by.
- Maintenance Log: full CRUD; Port/Starboard or NA; spreadsheet list; PDF export with filename `{VesselName}_{Date}_MaintenanceLog.pdf`; expo-file-system/legacy for rename.
- Home: vertical list of shortcut cards; Maintenance Log included.

---

## ⚠️ KNOWN ISSUES / NOTES

1. **DB migrations** — Run SQL in Supabase for vessel_tasks, yard_period_jobs, **maintenance_logs** (and ADD_MAINTENANCE_LOG_PORT_STARBOARD if table already existed).
2. **RLS** — May be disabled on `users`; app filters by vessel_id.
3. **Profile photos** — Require `profile-photos` storage bucket.
4. **PDF export** — Uses `expo-file-system/legacy` for `moveAsync` (current expo-file-system main API deprecated it).

---

## 🎯 SUGGESTED NEXT STEPS

1. **Inventory** — Categories and items by department.
2. **Watch duties** — Schedule and checklist (local checkboxes).
3. **General duties** — HOD-defined duty categories.
4. **RLS** — Production-safe policies.

---

## 🔧 QUICK REFERENCE

### Commands
```bash
cd "/Users/clintonhandford/Desktop/Yachy App/yachy-app"
npm start
```

### Home Screen convention
- **Vertical list** of shortcut cards (one per row). Add new features as another card in `shortcutList` with `shortcutCard` style (icon + label).

### Navigation
- Home → Tasks → Upcoming Tasks | Overdue | Daily | Weekly | Monthly → AddEditTask.
- Home → Upcoming Trips → (Guest | Boss | Delivery | Yard Period) → AddEditTrip.
- Home → Maintenance Log → Add Log / Edit / Delete / Download PDF.
- Home → Yard Period → Create New Job → AddEditYardJob.
- Home → Settings.

---

**Next agent:** Ensure DB migrations are applied if user reports missing tables or columns. Continue with Inventory, Watch Duties, or other modules from PROJECT_SPEC.
