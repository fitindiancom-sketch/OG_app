import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const DAILY_NOTIFICATIONS = [
  {
    id: "breakfast",
    hour: 7,
    minute: 0,
    title: "Breakfast Time!",
    body: "It's 7:00 AM — your breakfast window is now open. Log your meal and upload a photo!",
  },
  {
    id: "lunch",
    hour: 11,
    minute: 0,
    title: "Lunch Time!",
    body: "It's 11:00 AM — your lunch window is open. Don't forget to log your meal.",
  },
  {
    id: "exercise_evening",
    hour: 15,
    minute: 0,
    title: "Evening Walk & Snack Time!",
    body: "3:00 PM — time for your 8 almonds, green tea, and evening walk (6000–7000 steps).",
  },
  {
    id: "dinner",
    hour: 18,
    minute: 0,
    title: "Dinner Time!",
    body: "6:00 PM — your dinner window is now open. Log your meal and upload a photo.",
  },
  {
    id: "end_of_day",
    hour: 21,
    minute: 0,
    title: "End of Day — Upload Time!",
    body: "9:00 PM — all sections are now unlocked. Upload any photos you missed today!",
  },
];

async function scheduleAllNotifications() {
  if (Platform.OS === "web") return;

  // Cancel all existing scheduled notifications first
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const notif of DAILY_NOTIFICATIONS) {
    await Notifications.scheduleNotificationAsync({
      identifier: `diet_${notif.id}`,
      content: {
        title: notif.title,
        body: notif.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: notif.hour,
        minute: notif.minute,
      },
    });
  }
}

export function useNotifications() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    (async () => {
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus === "granted") {
          await scheduleAllNotifications();
        }
      } catch {
        // Notifications not supported in this environment — ignore
      }
    })();
  }, []);
}
