import apiClient from '../services/api';

/**
 * Converts a URL-safe Base64 string to a Uint8Array for VAPID applicationServerKey.
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Valid EC P-256 public VAPID key matching application.yml defaults.
 */
const DEFAULT_VAPID_PUBLIC_KEY =
  import.meta.env.VITE_VAPID_PUBLIC_KEY ||
  'BK8qFhuZMLDuXBW86RWjv-8SWGSgOw7ScNoDSmIur73k5OxeYPLrUACz520UkrW3W0c43WIkSMIH5LvruYeNHtQ';

/**
 * Prompts user for notification permission, subscribes via ServiceWorker PushManager,
 * and POSTs subscription JSON to Spring Boot backend using the shared apiClient
 * (which automatically applies VITE_API_BASE_URL and the JWT Bearer token).
 */
export async function subscribeUserToPush(vapidPublicKey = DEFAULT_VAPID_PUBLIC_KEY) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // 1. Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission is blocked. Please allow notifications in your browser site settings (lock/tune icon near URL bar).');
  }

  // 2. Wait for Service Worker registration
  const registration = await navigator.serviceWorker.ready;

  // 3. Check for existing subscription or create new
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });
  }

  // 4. Format subscription payload for PushSubscriptionRequestDTO
  const rawSub = subscription.toJSON();
  const payload = {
    endpoint: rawSub.endpoint,
    keys: {
      p256dh: rawSub.keys.p256dh,
      auth: rawSub.keys.auth
    }
  };

  // 5. Send subscription to backend via shared apiClient (uses VITE_API_BASE_URL + JWT)
  const response = await apiClient.post('/api/v1/notifications/subscribe', payload);

  return { subscription, status: response.status };
}

export async function isPushSubscribed() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return subscription !== null;
}

