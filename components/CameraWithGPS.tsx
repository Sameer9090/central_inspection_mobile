import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { cacheDirectory, makeDirectoryAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import * as Location from 'expo-location';
import piexif from 'piexifjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface CameraWithGPSProps {
  onPhotoCaptured: (photoUri: string, gpsLocation: { latitude: number; longitude: number }) => void;
  onCancel: () => void;
}

function degToDmsRational(degFloat: number): [number, number][] {
  const absDeg = Math.abs(degFloat);
  const degrees = Math.floor(absDeg);
  const minutesFloat = (absDeg - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 6000);

  return [
    [degrees, 1],
    [minutes, 1],
    [seconds, 100],
  ];
}

export default function CameraWithGPS({ onPhotoCaptured, onCancel }: CameraWithGPSProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [capturing, setCapturing] = useState(false);
  const [gpsAcquiring, setGpsAcquiring] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#1976D2" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required to take photos.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    if (!locationPermission) {
      Alert.alert('GPS Required', 'Location permission is needed to embed GPS in the photo.');
      return;
    }

    setCapturing(true);
    setGpsAcquiring(true);

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const { latitude, longitude } = location.coords;

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: true,
        exif: true,
      });

      if (!photo.base64) {
        throw new Error('Failed to get photo base64 data');
      }

      const binaryData = Buffer.from(photo.base64, 'base64').toString('binary');
      const exifObj = piexif.load(binaryData);

      if (!exifObj.GPS) {
        exifObj.GPS = {};
      }

      exifObj.GPS[piexif.GPSIFD.GPSLatitude] = degToDmsRational(latitude);
      exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] = latitude >= 0 ? 'N' : 'S';
      exifObj.GPS[piexif.GPSIFD.GPSLongitude] = degToDmsRational(longitude);
      exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] = longitude >= 0 ? 'E' : 'W';

      const exifBytes = piexif.dump(exifObj);
      const newBinaryData = piexif.insert(exifBytes, binaryData);
      const newBase64 = Buffer.from(newBinaryData, 'binary').toString('base64');

      const fileUri = cacheDirectory + `photo_gps_${Date.now()}.jpg`;
      await makeDirectoryAsync(cacheDirectory!, { intermediates: true });
      await writeAsStringAsync(fileUri, newBase64, { encoding: 'base64' });

      setGpsAcquiring(false);
      setCapturing(false);
      onPhotoCaptured(fileUri, { latitude, longitude });

    } catch (error: any) {
      setGpsAcquiring(false);
      setCapturing(false);
      console.error('Camera/GPS error:', error);
      Alert.alert('Capture Failed', error?.message || 'Failed to capture photo with GPS', [{ text: 'OK' }]);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        ratio="4:3"
      />

      {/* Overlay - absolute positioned, NOT children of CameraView */}
      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="box-none">
          <TouchableOpacity onPress={onCancel} style={styles.iconButton}>
            <Text style={styles.iconText}>✕</Text>
          </TouchableOpacity>
          <View style={styles.gpsBadge}>
            {gpsAcquiring ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.gpsBadgeText}>📡 GPS Ready</Text>
            )}
          </View>
          <TouchableOpacity onPress={toggleCameraFacing} style={styles.iconButton}>
            <Text style={styles.iconText}>🔄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar} pointerEvents="box-none">
          <TouchableOpacity
            style={[styles.captureButton, (capturing || gpsAcquiring) && styles.captureButtonDisabled]}
            onPress={takePhoto}
            disabled={capturing || gpsAcquiring}
          >
            {capturing || gpsAcquiring ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {gpsAcquiring && (
        <View style={styles.gpsOverlay}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.gpsOverlayText}>Acquiring GPS location...</Text>
          <Text style={styles.gpsOverlaySubtext}>Please stay at the establishment</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#fff',
    fontSize: 20,
  },
  gpsBadge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gpsBadgeText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  gpsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  gpsOverlayText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  gpsOverlaySubtext: {
    color: '#aaa',
    fontSize: 14,
  },
  permissionText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 30,
  },
  button: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});