import { readAsStringAsync } from 'expo-file-system/legacy';
import piexif from 'piexifjs';

export interface ExifGPSLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;
  timestamp: string | null;
  source: 'photo_exif';
}

export const extractGPSFromImage = async (uri: string): Promise<ExifGPSLocation | null> => {
  try {
    const base64 = await readAsStringAsync(uri, {
      encoding: 'base64',
    });

    const binaryData = Buffer.from(base64, 'base64').toString('binary');
    const exifObj = piexif.load(binaryData);

    if (!exifObj.GPS || !exifObj.GPS[piexif.GPSIFD.GPSLatitude]) {
      console.log('No GPS data found in image EXIF');
      return null;
    }

    const latDms = exifObj.GPS[piexif.GPSIFD.GPSLatitude] as [number, number][];
    const latRef = exifObj.GPS[piexif.GPSIFD.GPSLatitudeRef] as string;
    const lonDms = exifObj.GPS[piexif.GPSIFD.GPSLongitude] as [number, number][];
    const lonRef = exifObj.GPS[piexif.GPSIFD.GPSLongitudeRef] as string;

    const latitude = dmsToDecimal(latDms, latRef || 'N');
    const longitude = dmsToDecimal(lonDms, lonRef || 'E');

    const altRaw = exifObj.GPS[piexif.GPSIFD.GPSAltitude] as [number, number] | undefined;

    return {
      latitude,
      longitude,
      altitude: altRaw ? altRaw[0] / altRaw[1] : null,
      timestamp: (exifObj.GPS[piexif.GPSIFD.GPSDateStamp] as string) || null,
      source: 'photo_exif',
    };
  } catch (error) {
    console.error('Error reading EXIF GPS:', error);
    return null;
  }
};

const dmsToDecimal = (dms: [number, number][], ref: string): number => {
  const degrees = dms[0][0] / dms[0][1];
  const minutes = dms[1][0] / dms[1][1];
  const seconds = dms[2][0] / dms[2][1];

  let decimal = degrees + minutes / 60 + seconds / 3600;
  if (ref === 'S' || ref === 'W') decimal = -decimal;
  return decimal;
};