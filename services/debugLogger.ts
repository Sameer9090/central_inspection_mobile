
import * as FileSystem from "expo-file-system/legacy";

const LOG_FILE = `${FileSystem.documentDirectory}offline-debug.log`;

let logQueue: Promise<void> = Promise.resolve();

const maskSensitiveData = (data: any): any => {
    if (Array.isArray(data)) {
        return data.map(maskSensitiveData);
    }

    if (data && typeof data === "object") {
        const masked: any = {};

        for (const [key, value] of Object.entries(data)) {
            if (/token|password|otp|authorization|secret/i.test(key)) {
                masked[key] = "[REDACTED]";
            } else {
                masked[key] = maskSensitiveData(value);
            }
        }

        return masked;
    }

    return data;
};

export const saveDebugLog = (
    label: string,
    data?: any,
    level: "LOG" | "WARN" | "ERROR" = "LOG"
): Promise<void> => {

    const task = logQueue.then(async () => {
        const timestamp = new Date().toISOString();

        let details = "";

        try {
            details = data !== undefined
                ? JSON.stringify(maskSensitiveData(data), null, 2)
                : "";
        } catch {
            details = "[Unable to serialize log data]";
        }

        const message =
            `[${timestamp}] [${level}] ${label} ${details}\n\n`;

        const fileInfo = await FileSystem.getInfoAsync(LOG_FILE);

        const existingLogs = fileInfo.exists
            ? await FileSystem.readAsStringAsync(LOG_FILE)
            : "";

        await FileSystem.writeAsStringAsync(
            LOG_FILE,
            existingLogs + message,
            { encoding: FileSystem.EncodingType.UTF8 }
        );
    });

    logQueue = task.catch(() => {
        // Prevent recursive logging if file writing fails.
    });

    return task;
};
