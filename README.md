# Wireless Database & Master Control Center

## ⚡ Quick Launch Command
You can start the server from **any** terminal (PowerShell or Command Prompt) across your computer by typing:
```cmd
nofear
```
*(or `nofear server on`)*

---

## 🔑 Master Admin Credentials
- **Master Admin ID**: `NOFEAR`
- **Master Password**: `NOFEAR009`
- **Permissions**: Full Master Control Center rights, direct data record editing (✏️ Edit), user management, audit security logs, instant data record approvals, and deletions.

---

## 🌐 Portal Endpoints
| Portal | URL | Description |
| :--- | :--- | :--- |
| **Control Center** | [http://localhost:3000/control](http://localhost:3000/control) | Master Control Dashboard (Uptime, Metrics, Seed Admin, Backup Download) |
| **Admin Login** | [http://localhost:3000/admin](http://localhost:3000/admin) | Admin Portal & Security Console |
| **Data Entry** | [http://localhost:3000](http://localhost:3000) | Public Data Submission & Categorized Tables Viewer |

---

## 📊 Smart Table Data Merging
- When saving or approving a record with an existing **Title / Category Table Name** (e.g. `Student Records`), the server automatically **appends and merges** the new payload into the existing record instead of creating duplicate fragmented rows.

---

## 🗄️ Database & Supabase Integration
- **Supabase Project URL**: `https://dygmhlghcmprjtvxjzxx.supabase.co`
- **Configuration File**: `.env`
- **Database Schema**: [schema.sql](./schema.sql)
- **Tables**: `users`, `data_records`, `pending_approvals`, `audit_logs`

---

## 📁 File Structure
- `server.js` - Express backend with authentication, Supabase client, and web interfaces.
- `cli.js` - CLI execution handler for the `nofear` command.
- `nofear.cmd` - Windows terminal command wrapper.
- `storage/` - Local database cache directory (`users.json`, `data.json`, `pending.json`, `logs.json`).
- `schema.sql` - PostgreSQL migration script for Supabase tables.
