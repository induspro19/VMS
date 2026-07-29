import { supabase } from './supabase';

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const registerPushSubscription = async (employeeId: string) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported in this browser.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });
    }

    if (subscription) {
      const subJson = subscription.toJSON();
      
      const { error } = await supabase.from('push_subscriptions').upsert({
        employee_id: employeeId,
        subscription_json: subJson,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'idx_push_subscriptions_employee_endpoint'
      });

      if (error) {
        console.error('Failed to save push subscription to Supabase:', error);
      } else {
        console.log('Push subscription saved for employee:', employeeId);
      }
    }
  } catch (error) {
    console.error('Error during push subscription:', error);
  }
};
