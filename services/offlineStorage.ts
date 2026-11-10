import { getOfflineDatabase } from "./offlineDatabase";


export const saveCachedApplication = async (
    referenceNumber: string,
    response: any
) => {
    const db = await getOfflineDatabase();

    await db.runAsync(
        `INSERT INTO cached_applications (
            reference_number,
            application_json,
            common_json,
            ase_json,
            contract_json,
            mw_json,
            selected_types_json,
            response_json,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(reference_number) DO UPDATE SET
            application_json = excluded.application_json,
            common_json = excluded.common_json,
            ase_json = excluded.ase_json,
            contract_json = excluded.contract_json,
            mw_json = excluded.mw_json,
            selected_types_json = excluded.selected_types_json,
            response_json = excluded.response_json,
            updated_at = excluded.updated_at`,
        [
            referenceNumber,
            JSON.stringify(response.application ?? null),
            JSON.stringify(response.common ?? null),
            JSON.stringify(response.inspections ?? []),
            null,
            null,
            null,
            JSON.stringify(response),
            new Date().toISOString(),
        ]
    );

    console.log("APPLICATION CACHED:", referenceNumber);
};

export const getCachedApplication = async (
    referenceNumber: string
): Promise<any | null> => {
    const db = await getOfflineDatabase();

    const result = await db.getFirstAsync<{ response_json: string }>(
        `SELECT response_json
     FROM cached_applications
     WHERE reference_number = ?`,
        [referenceNumber]
    );

    if (!result?.response_json) {
        return null;
    }

    return JSON.parse(result.response_json);
};

export const saveApplicationQueue = async (applications: any[]) => {
    const db = await getOfflineDatabase();

    await db.runAsync(
        `DELETE FROM cached_application_queue`
    );

    await db.runAsync(
        `INSERT INTO cached_application_queue
     (applications_json, updated_at)
     VALUES (?, ?)`,
        [
            JSON.stringify(applications),
            new Date().toISOString(),
        ]
    );
};

export const getApplicationQueue = async () => {
    const db = await getOfflineDatabase();

    const result = await db.getFirstAsync<{
        applications_json: string;
    }>(
        `SELECT applications_json
     FROM cached_application_queue
     ORDER BY id DESC
     LIMIT 1`
    );

    return result?.applications_json
        ? JSON.parse(result.applications_json)
        : null;
};

export const saveDashboardCache = async (dashboardData: any) => {
    const db = await getOfflineDatabase();

    await db.runAsync(
        `CREATE TABLE IF NOT EXISTS cached_dashboard (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      dashboard_json TEXT NOT NULL,
      updated_at TEXT
    )`
    );

    await db.runAsync(
        `INSERT OR REPLACE INTO cached_dashboard
     (id, dashboard_json, updated_at)
     VALUES (1, ?, ?)`,
        [
            JSON.stringify(dashboardData),
            new Date().toISOString(),
        ]
    );
};

export const getDashboardCache = async () => {
    const db = await getOfflineDatabase();

    const result = await db.getFirstAsync<{
        dashboard_json: string;
    }>(
        `SELECT dashboard_json
     FROM cached_dashboard
     WHERE id = 1`
    );

    return result?.dashboard_json
        ? JSON.parse(result.dashboard_json)
        : null;
};

export const saveInspectionDraft = async (
    referenceNumber: string,
    inspectionType: string,
    payload: any
) => {
    const db = await getOfflineDatabase();

    await db.runAsync(
        `INSERT INTO inspection_drafts (
      reference_number,
      inspection_type,
      payload_json,
      updated_at
    )
    VALUES (?, ?, ?, ?)
    ON CONFLICT(reference_number, inspection_type)
    DO UPDATE SET
      payload_json = excluded.payload_json,
      updated_at = excluded.updated_at`,
        [
            referenceNumber,
            inspectionType,
            JSON.stringify(payload),
            new Date().toISOString(),
        ]
    );
    console.log("SAVING OFFLINE DRAFT:", {
        referenceNumber,
        inspectionType,
        payloadKeys: Object.keys(payload || {}),
        pincodePresent: !!payload?.est_pincode,
        panchayatPresent: !!payload?.panchayat,
    });
};

export const getInspectionDraft = async (
    referenceNumber: string,
    inspectionType: string
) => {
    const db = await getOfflineDatabase();

    const result = await db.getFirstAsync<{ payload_json: string }>(
        `SELECT payload_json
     FROM inspection_drafts
     WHERE reference_number = ?
       AND inspection_type = ?`,
        [referenceNumber, inspectionType]
    );
    console.log("READING OFFLINE DRAFT:", {
        referenceNumber,
        inspectionType,
        found: !!result?.payload_json,
    });
    return result?.payload_json
        ? JSON.parse(result.payload_json)
        : null;
};

export const deleteInspectionDrafts = async (
    referenceNumber: string
) => {
    const db = await getOfflineDatabase();

    await db.runAsync(
        `DELETE FROM inspection_drafts
     WHERE reference_number = ?`,
        [referenceNumber]
    );
};

export const deleteInspectionDraftsForSection = async (
    referenceNumber: string,
    inspectionType: string
) => {
    const db = await getOfflineDatabase();

    await db.runAsync(
        `DELETE FROM inspection_drafts
         WHERE reference_number = ?
         AND inspection_type = ?`,
        [referenceNumber, inspectionType]
    );

    console.log("SECTION DRAFT DELETED:", {
        referenceNumber,
        inspectionType
    });
};

export const savePendingInspection = async (
    referenceNumber: string,
    payload: any
) => {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();

    const result = await db.runAsync(
        `INSERT INTO completed_inspections (
            reference_number,
            common_json,
            ase_json,
            contract_json,
            mw_json,
            selected_types_json,
            submission_status,
            submitted_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, ?)
        ON CONFLICT(reference_number) DO UPDATE SET
            common_json = excluded.common_json,
            ase_json = excluded.ase_json,
            contract_json = excluded.contract_json,
            mw_json = excluded.mw_json,
            selected_types_json = excluded.selected_types_json,
            submission_status = 'pending',
            submitted_at = NULL,
            updated_at = excluded.updated_at
        WHERE completed_inspections.submission_status != 'submitted'`,
        [
            referenceNumber,
            JSON.stringify(payload.common ?? null),
            JSON.stringify(payload.ase ?? null),
            JSON.stringify(payload.contract ?? null),
            JSON.stringify(payload.minimumWage ?? null),
            JSON.stringify(payload.selectedTypes ?? []),
            now,
        ]
    );

    if (result.changes === 0) {
        throw new Error(
            'This inspection is already marked as submitted on this device. The pending record was not allowed to overwrite it.'
        );
    }

    console.log('PENDING INSPECTION SAVED:', referenceNumber);
};

export const getPendingInspection = async (referenceNumber: string) => {
    const db = await getOfflineDatabase();
    const result = await db.getFirstAsync<any>(
        `SELECT * FROM completed_inspections
         WHERE reference_number = ? AND submission_status = 'pending'`,
        [referenceNumber]
    );

    if (!result) return null;

    return {
        referenceNumber: result.reference_number,
        common: result.common_json ? JSON.parse(result.common_json) : null,
        ase: result.ase_json ? JSON.parse(result.ase_json) : null,
        contract: result.contract_json ? JSON.parse(result.contract_json) : null,
        minimumWage: result.mw_json ? JSON.parse(result.mw_json) : null,
        selectedTypes: result.selected_types_json
            ? JSON.parse(result.selected_types_json)
            : [],
        submissionStatus: result.submission_status,
        updatedAt: result.updated_at,
    };
};

export const saveCompletedInspection = async (
    referenceNumber: string,
    payload: any
) => {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `INSERT INTO completed_inspections (
            reference_number,
            common_json,
            ase_json,
            contract_json,
            mw_json,
            selected_types_json,
            submission_status,
            submitted_at,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?)
        ON CONFLICT(reference_number) DO UPDATE SET
            common_json = excluded.common_json,
            ase_json = excluded.ase_json,
            contract_json = excluded.contract_json,
            mw_json = excluded.mw_json,
            selected_types_json = excluded.selected_types_json,
            submission_status = 'submitted',
            submitted_at = excluded.submitted_at,
            updated_at = excluded.updated_at`,
        [
            referenceNumber,
            JSON.stringify(payload.common ?? null),
            JSON.stringify(payload.ase ?? null),
            JSON.stringify(payload.contract ?? null),
            JSON.stringify(payload.minimumWage ?? null),
            JSON.stringify(payload.selectedTypes ?? []),
            now,
            now
        ]
    );

    console.log("COMPLETED INSPECTION SAVED:", referenceNumber);
};

export const getCompletedInspection = async (
    referenceNumber: string
) => {
    const db = await getOfflineDatabase();

    const result = await db.getFirstAsync<any>(
        `SELECT *
         FROM completed_inspections
         WHERE reference_number = ?
         AND submission_status = 'submitted'`,
        [referenceNumber]
    );

    if (!result) {
        return null;
    }

    return {
        referenceNumber: result.reference_number,
        common: result.common_json
            ? JSON.parse(result.common_json)
            : null,
        ase: result.ase_json
            ? JSON.parse(result.ase_json)
            : null,
        contract: result.contract_json
            ? JSON.parse(result.contract_json)
            : null,
        minimumWage: result.mw_json
            ? JSON.parse(result.mw_json)
            : null,
        selectedTypes: result.selected_types_json
            ? JSON.parse(result.selected_types_json)
            : [],
        submissionStatus: result.submission_status,
        submittedAt: result.submitted_at
    };
};

export const saveOfflineDownloadRecords = async (
    applications: any[]
) => {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();

    for (const app of applications) {
        const referenceNumber = String(app.appl_ref_no || "");
        const inspectionDate = app.inspection_scheduled_on;

        if (!referenceNumber || !inspectionDate) continue;
        console.log("OFFLINE DOWNLOAD DATE CHECK:", {
            referenceNumber,
            incomingDate: inspectionDate,
        });
        await db.runAsync(
            `INSERT INTO offline_application_downloads (
                reference_number,
                inspection_date,
                download_status,
                attempts,
                updated_at
            )
            VALUES (?, ?, 'pending', 0, ?)
            ON CONFLICT(reference_number)
            DO UPDATE SET
                download_status = CASE
                    WHEN offline_application_downloads.inspection_date
                        != excluded.inspection_date
                    THEN 'pending'
                    ELSE offline_application_downloads.download_status
                END,
                attempts = CASE
                    WHEN offline_application_downloads.inspection_date
                        != excluded.inspection_date
                    THEN 0
                    ELSE offline_application_downloads.attempts
                END,
                last_error = CASE
                    WHEN offline_application_downloads.inspection_date
                        != excluded.inspection_date
                    THEN NULL
                    ELSE offline_application_downloads.last_error
                END,
                downloaded_at = CASE
                    WHEN offline_application_downloads.inspection_date
                        != excluded.inspection_date
                    THEN NULL
                    ELSE offline_application_downloads.downloaded_at
                END,
                inspection_date = excluded.inspection_date,
                updated_at = excluded.updated_at
            `,
            [referenceNumber, inspectionDate, now]
        );
    }
};

interface OfflineDownloadRecord {
    reference_number: string;
    download_status: "pending" | "downloading" | "downloaded" | "failed";
}

export const getOfflineDownloadRecords = async () => {
    const db = await getOfflineDatabase();

    return await db.getAllAsync<OfflineDownloadRecord>(
        `SELECT *
         FROM offline_application_downloads
         ORDER BY inspection_date ASC`
    );
};

// export const getOfflineDownloadRecords = async () => {
//     const db = await getOfflineDatabase();

//     return await db.getAllAsync(
//         `SELECT *
//          FROM offline_application_downloads
//          ORDER BY inspection_date ASC`
//     );
// };

export const updateOfflineDownloadStatus = async (
    referenceNumber: string,
    status: "pending" | "downloading" | "downloaded" | "failed",
    errorMessage: string | null = null
) => {
    const db = await getOfflineDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
        `UPDATE offline_application_downloads
         SET
            download_status = ?,
            attempts = CASE
                WHEN ? = 'downloading' THEN attempts + 1
                ELSE attempts
            END,
            last_error = ?,
            downloaded_at = CASE
                WHEN ? = 'downloaded' THEN ?
                WHEN ? = 'pending' THEN NULL
                ELSE downloaded_at
            END,
            updated_at = ?
         WHERE reference_number = ?`,
        [
            status,
            status,
            errorMessage,
            status,
            now,
            status,
            now,
            referenceNumber
        ]
    );
};

export const getOfflineDownloadProgress = async () => {
    const db = await getOfflineDatabase();

    const result = await db.getFirstAsync<{
        total: number;
        downloaded: number;
        pending: number;
        downloading: number;
        failed: number;
    }>(
        `SELECT
            COUNT(*) AS total,
            COALESCE(SUM(CASE WHEN download_status = 'downloaded' THEN 1 ELSE 0 END), 0) AS downloaded,
            COALESCE(SUM(CASE WHEN download_status = 'pending' THEN 1 ELSE 0 END), 0) AS pending,
            COALESCE(SUM(CASE WHEN download_status = 'downloading' THEN 1 ELSE 0 END), 0) AS downloading,
            COALESCE(SUM(CASE WHEN download_status = 'failed' THEN 1 ELSE 0 END), 0) AS failed
         FROM offline_application_downloads`
    );

    return {
        total: result?.total ?? 0,
        downloaded: result?.downloaded ?? 0,
        pending: result?.pending ?? 0,
        downloading: result?.downloading ?? 0,
        failed: result?.failed ?? 0
    };
};

export const resetInterruptedOfflineDownloads = async () => {
    const db = await getOfflineDatabase();

    await db.runAsync(
        `UPDATE offline_application_downloads
         SET
            download_status = 'pending',
            last_error = 'Download interrupted. Please retry.',
            updated_at = ?
         WHERE download_status = 'downloading'`,
        [new Date().toISOString()]
    );
};