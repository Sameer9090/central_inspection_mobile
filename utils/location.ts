// utils/location.ts
import * as Location from "expo-location";

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  timestamp: number;
}

/**
 * Get GPS location — MANDATORY
 * Throws error if GPS is off, permission denied, or timeout
 */
export const getCurrentLocation = async (
  timeoutMs: number = 60000
): Promise<GPSLocation> => {
  // 1. Check permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    throw new Error("LOCATION_PERMISSION_DENIED");
  }

  // 2. Check if GPS is turned ON
  const enabled = await Location.hasServicesEnabledAsync();
  if (!enabled) {
    throw new Error("GPS_DISABLED");
  }

  // 3. Try last known position first (fastest)
  try {
    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown) {
      return {
        latitude: lastKnown.coords.latitude,
        longitude: lastKnown.coords.longitude,
        accuracy: lastKnown.coords.accuracy,
        altitude: lastKnown.coords.altitude,
        timestamp: lastKnown.timestamp,
      };
    }
  } catch {
    // continue to fresh fix
  }

  // 4. Get fresh GPS fix
  const locationPromise = Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    mayShowUserSettingsDialog: true,
  });

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("GPS_TIMEOUT")), timeoutMs)
  );

  const location = await Promise.race([locationPromise, timeoutPromise]);

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
    altitude: location.coords.altitude,
    timestamp: location.timestamp,
  };
};