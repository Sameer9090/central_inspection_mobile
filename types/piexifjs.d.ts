declare module 'piexifjs' {
  export const GPSIFD: {
    GPSLatitude: number;
    GPSLatitudeRef: number;
    GPSLongitude: number;
    GPSLongitudeRef: number;
    GPSAltitude: number;
    GPSAltitudeRef: number;
    GPSTimeStamp: number;
    GPSDateStamp: number;
    GPSMapDatum: number;
    GPSStatus: number;
    GPSMeasureMode: number;
    GPSDOP: number;
    GPSSpeedRef: number;
    GPSSpeed: number;
    GPSTrackRef: number;
    GPSTrack: number;
    GPSImgDirectionRef: number;
    GPSImgDirection: number;
    GPSDestLatitude: number;
    GPSDestLatitudeRef: number;
    GPSDestLongitude: number;
    GPSDestLongitudeRef: number;
    GPSDestBearingRef: number;
    GPSDestBearing: number;
    GPSDestDistanceRef: number;
    GPSDestDistance: number;
    GPSProcessingMethod: number;
    GPSAreaInformation: number;
    GPSDifferential: number;
    GPSHPositioningError: number;
  };

  export interface ExifObject {
    '0th'?: Record<number, any>;
    '1st'?: Record<number, any>;
    Exif?: Record<number, any>;
    GPS?: Record<number, any>;
    Interop?: Record<number, any>;
    thumbnail?: any;
  }

  export function load(jpegBinaryString: string): ExifObject;
  export function dump(exifObject: ExifObject): string;
  export function insert(exifBytes: string, jpegBinaryString: string): string;
  export function remove(jpegBinaryString: string): string;

  const piexif: {
    GPSIFD: typeof GPSIFD;
    load: typeof load;
    dump: typeof dump;
    insert: typeof insert;
    remove: typeof remove;
  };

  export default piexif;
}