
import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "cis_offline.db";

let db: SQLite.SQLiteDatabase | null = null;



export const getOfflineDatabase = async () => {
    try {
        console.log("OFFLINE DB: Opening database...");

        if (db) {
            console.log("OFFLINE DB: Existing connection reused");
            return db;
        }

        db = await SQLite.openDatabaseAsync(DATABASE_NAME);

        console.log("OFFLINE DB: Database opened successfully");

        await db.execAsync(`
            PRAGMA journal_mode = WAL;

            CREATE TABLE IF NOT EXISTS cached_applications (
                reference_number TEXT PRIMARY KEY,
                application_json TEXT,
                common_json TEXT,
                ase_json TEXT,
                contract_json TEXT,
                mw_json TEXT,
                selected_types_json TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS inspection_drafts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reference_number TEXT NOT NULL,
                inspection_type TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                updated_at TEXT,
                UNIQUE(reference_number, inspection_type)
            );

            CREATE TABLE IF NOT EXISTS completed_inspections (
                reference_number TEXT PRIMARY KEY,
                common_json TEXT,
                ase_json TEXT,
                contract_json TEXT,
                mw_json TEXT,
                selected_types_json TEXT,
                submission_status TEXT DEFAULT 'submitted',
                submitted_at TEXT,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS sync_queue (
                id TEXT PRIMARY KEY,
                reference_number TEXT NOT NULL,
                sync_type TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                attempts INTEGER DEFAULT 0,
                last_error TEXT,
                created_at TEXT
            );

            CREATE TABLE IF NOT EXISTS local_files (
                id TEXT PRIMARY KEY,
                reference_number TEXT NOT NULL,
                field_key TEXT NOT NULL,
                local_uri TEXT NOT NULL,
                original_name TEXT,
                mime_type TEXT,
                remote_path TEXT,
                upload_status TEXT DEFAULT 'pending'
            );

            CREATE INDEX IF NOT EXISTS idx_drafts_reference
            ON inspection_drafts(reference_number);

            CREATE INDEX IF NOT EXISTS idx_sync_status
            ON sync_queue(status);

            CREATE INDEX IF NOT EXISTS idx_files_reference
            ON local_files(reference_number);

            CREATE TABLE IF NOT EXISTS cached_application_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                applications_json TEXT NOT NULL,
                updated_at TEXT
            );

            CREATE TABLE IF NOT EXISTS debug_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                level TEXT NOT NULL,
                source TEXT,
                message TEXT NOT NULL,
                details TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_debug_logs_timestamp
            ON debug_logs(timestamp);

            CREATE TABLE IF NOT EXISTS offline_application_downloads (
                reference_number TEXT PRIMARY KEY,
                inspection_date TEXT NOT NULL,
                download_status TEXT DEFAULT 'pending',
                attempts INTEGER DEFAULT 0,
                last_error TEXT,
                downloaded_at TEXT,
                updated_at TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_offline_download_status
            ON offline_application_downloads(download_status);

            CREATE INDEX IF NOT EXISTS idx_offline_download_date
            ON offline_application_downloads(inspection_date);

            CREATE TABLE IF NOT EXISTS pending_inspections (
                reference_number TEXT PRIMARY KEY,
                payload_json TEXT NOT NULL,
                submission_status TEXT DEFAULT 'pending',
                updated_at TEXT
            );
        `);

        console.log("OFFLINE DB: Tables created successfully");

        // Add response_json to existing databases if it doesn't exist.
        const columns = await db.getAllAsync<{ name: string }>(
            `PRAGMA table_info(cached_applications)`
        );

        if (!columns.some(column => column.name === "response_json")) {
            await db.execAsync(`
                ALTER TABLE cached_applications
                ADD COLUMN response_json TEXT;
            `);
        }

        console.log("OFFLINE DB: Initialization completed");

        return db;

    } catch (error) {
        console.error("OFFLINE DB INITIALIZATION ERROR:", error);
        db = null;
        throw error;
    }
};


export const verifyOfflineTables = async () => {
    const database = await getOfflineDatabase();

    const result = await database.getAllAsync<{ name: string }>(
        `SELECT name FROM sqlite_master
         WHERE type = 'table'
         AND name NOT LIKE 'sqlite_%'
         ORDER BY name`
    );

    console.log(
        "CIS Offline Tables:",
        result.map(item => item.name)
    );

    return result;
};
