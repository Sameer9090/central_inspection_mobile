
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";

const OFFLINE_AUTH_KEY = "cis_offline_auth";
const OFFLINE_USER_KEY = "offline_user";

// PBKDF2 configuration for offline password verification.
const PBKDF2_ITERATIONS = 120000;
const KEY_SIZE = 256 / 32;

// Password is held only temporarily in JavaScript memory.
// It is never written to AsyncStorage or SQLite.
let pendingOfflinePassword: string | null = null;

/**
 * Temporarily retain the password after successful online login.
 * This allows OTP verification to provision offline access
 * without passing the password through navigation parameters.
 */
export const setPendingOfflinePassword = (password: string) => {
    pendingOfflinePassword = password;
};

/**
 * Clear the temporary password from application memory.
 */
export const clearPendingOfflinePassword = () => {
    pendingOfflinePassword = null;
};

/**
 * Derive a password verifier using PBKDF2.
 */
const derivePasswordVerifier = (
    password: string,
    salt: string,
    iterations: number
): string => {
    const derivedKey = CryptoJS.PBKDF2(
        password,
        CryptoJS.enc.Hex.parse(salt),
        {
            keySize: KEY_SIZE,
            iterations,
            hasher: CryptoJS.algo.SHA256,
        }
    );

    return derivedKey.toString(CryptoJS.enc.Hex);
};

/**
 * Save offline authentication credentials after successful OTP.
 *
 * The original password is never stored.
 * Only the derived verifier and random salt are stored securely.
 */
export const saveOfflineCredentials = async (
    username: string,
    user: any
): Promise<void> => {
    try {
        if (!pendingOfflinePassword) {
            throw new Error(
                "Offline credentials cannot be created. Password is unavailable."
            );
        }

        if (!username?.trim()) {
            throw new Error("Username is required.");
        }

        const salt = CryptoJS.lib.WordArray.random(32).toString(
            CryptoJS.enc.Hex
        );

        const verifier = derivePasswordVerifier(
            pendingOfflinePassword,
            salt,
            PBKDF2_ITERATIONS
        );

        const credentials = {
            username: username.trim().toLowerCase(),
            salt,
            verifier,
            iterations: PBKDF2_ITERATIONS,
            version: 1,
            createdAt: new Date().toISOString(),
        };

        // Store authentication verifier securely.
        await SecureStore.setItemAsync(
            OFFLINE_AUTH_KEY,
            JSON.stringify(credentials)
        );

        // Store minimum profile separately for offline display.
        await AsyncStorage.setItem(
            OFFLINE_USER_KEY,
            JSON.stringify(user)
        );

        console.log("OFFLINE AUTH: Credentials provisioned successfully.");
    } finally {
        // Never retain the password after provisioning attempt.
        clearPendingOfflinePassword();
    }
};

/**
 * Verify username and password without internet.
 */
export const verifyOfflineCredentials = async (
    username: string,
    password: string
): Promise<boolean> => {
    try {
        if (!username?.trim() || !password) {
            return false;
        }

        const storedCredentials = await SecureStore.getItemAsync(
            OFFLINE_AUTH_KEY
        );

        if (!storedCredentials) {
            return false;
        }

        const credentials = JSON.parse(storedCredentials);

        if (
            credentials.version !== 1 ||
            credentials.username !== username.trim().toLowerCase()
        ) {
            return false;
        }

        const enteredVerifier = derivePasswordVerifier(
            password,
            credentials.salt,
            credentials.iterations
        );

        // Constant-time comparison of hexadecimal verifier strings.
        if (enteredVerifier.length !== credentials.verifier.length) {
            return false;
        }

        let difference = 0;

        for (let i = 0; i < enteredVerifier.length; i++) {
            difference |=
                enteredVerifier.charCodeAt(i) ^
                credentials.verifier.charCodeAt(i);
        }

        return difference === 0;
    } catch (error) {
        console.error("OFFLINE AUTH VERIFICATION ERROR:", error);
        return false;
    }
};

/**
 * Retrieve the cached user profile for offline dashboard access.
 */
export const getOfflineUser = async (): Promise<any | null> => {
    try {
        const user = await AsyncStorage.getItem(OFFLINE_USER_KEY);

        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error("OFFLINE USER READ ERROR:", error);
        return null;
    }
};

/**
 * Check whether offline authentication has been provisioned.
 */
export const hasOfflineCredentials = async (): Promise<boolean> => {
    try {
        const credentials = await SecureStore.getItemAsync(
            OFFLINE_AUTH_KEY
        );

        return !!credentials;
    } catch (error) {
        console.error("OFFLINE AUTH CHECK ERROR:", error);
        return false;
    }
};

/**
 * Remove offline authentication from this device.
 */
export const clearOfflineCredentials = async (): Promise<void> => {
    try {
        await SecureStore.deleteItemAsync(OFFLINE_AUTH_KEY);
        await AsyncStorage.removeItem(OFFLINE_USER_KEY);

        clearPendingOfflinePassword();

        console.log("OFFLINE AUTH: Credentials removed.");
    } catch (error) {
        console.error("OFFLINE AUTH CLEAR ERROR:", error);
        throw error;
    }
};
