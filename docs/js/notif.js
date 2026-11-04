// Rappel quotidien : abonnement du téléphone aux notifications.
import { CLE_PUBLIQUE_VAPID } from './config.js';

const enOctets = (b64) => {
  const s = (b64 + '='.repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
};

export const estInstallee = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

export async function etatRappel() {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) return 'indisponible';
  if (Notification.permission === 'denied') return 'refuse';
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? 'actif' : 'inactif';
}

export async function activerRappel() {
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') throw new Error('Notifications refusées.');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: enOctets(CLE_PUBLIQUE_VAPID) });
  return JSON.stringify(sub);
}

export async function testerNotification() {
  const reg = await navigator.serviceWorker.ready;
  await reg.showNotification('Ta série t’attend', { body: 'Le rappel fonctionne sur ce téléphone.', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' });
}
