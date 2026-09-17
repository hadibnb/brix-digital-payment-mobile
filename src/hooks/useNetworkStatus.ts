import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export type NetworkStatus = {
  isConnected: boolean;
  /** True when the device is connected but the reachability probe failed. */
  isInternetReachable: boolean | null;
  type: string;
  /** True only when we are confident there is no usable connection. */
  isOffline: boolean;
};

function read(state: NetInfoState): NetworkStatus {
  const reachable = state.isInternetReachable;
  const connected = Boolean(state.isConnected);
  return {
    isConnected: connected,
    isInternetReachable: reachable,
    type: String(state.type ?? 'unknown'),
    // Only claim offline when we are sure: `isInternetReachable` is null while
    // the probe is still pending, and treating that as offline would flash a
    // false "no internet" banner on every launch.
    isOffline: !connected || reachable === false,
  };
}

/** Live connectivity, used by the global offline banner and by retry gates. */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: 'unknown',
    isOffline: false,
  });

  useEffect(() => {
    let active = true;
    void NetInfo.fetch().then((state) => {
      if (active) setStatus(read(state));
    });
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (active) setStatus(read(state));
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return status;
}
