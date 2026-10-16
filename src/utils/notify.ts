import * as Notifications from 'expo-notifications';

// Mostra la notifica anche quando l'app è aperta (di default iOS la nasconde)
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }) as Notifications.NotificationBehavior,
});

/** Chiede il permesso per le notifiche (una sola volta); restituisce true se concesso */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/** Invia subito una notifica locale vera. Restituisce false se non è stato possibile. */
export async function sendLocalNotification(title: string, body: string): Promise<boolean> {
  try {
    if (!(await ensureNotificationPermission())) return false;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null, // subito
    });
    return true;
  } catch {
    return false;
  }
}
