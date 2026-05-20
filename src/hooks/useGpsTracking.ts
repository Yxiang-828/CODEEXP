import { useEffect, useRef } from 'react';
import type { LngLat } from '../AppContext';

interface Options {
  enabled: boolean;
  onLocation: (loc: LngLat) => void;
  onError?: (err: GeolocationPositionError) => void;
}

export default function useGpsTracking({ enabled, onLocation, onError }: Options) {
  const watchId = useRef<number | null>(null);
  const onLocationRef = useRef(onLocation);
  const onErrorRef = useRef(onError);
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  // Keep refs current every render so watchPosition callbacks never go stale
  onLocationRef.current = onLocation;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!supported || !enabled) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        onLocationRef.current({ lng: pos.coords.longitude, lat: pos.coords.latitude });
      },
      (err) => {
        onErrorRef.current?.(err);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [enabled, supported]);

  return { supported };
}
