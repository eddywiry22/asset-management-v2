import { useEffect, useState, useCallback } from 'react';
import { getNotificationCount } from '@/services/movementRequestService';
import { useAuth } from '@/contexts/AuthContext';

const ACTION_ROLES = ['warehouse_head', 'operator', 'requester'];
const POLL_INTERVAL_MS = 30_000; // 30 seconds

export default function useNotificationCount() {
  const { isAuthenticated, user } = useAuth();
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!isAuthenticated || !ACTION_ROLES.includes(user?.role)) {
      setCount(0);
      return;
    }
    try {
      const res = await getNotificationCount();
      setCount(res.data?.data?.count ?? 0);
    } catch {
      // Silently ignore errors (e.g. network hiccups)
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    fetchCount();
    const timer = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchCount]);

  return { count, refresh: fetchCount };
}
