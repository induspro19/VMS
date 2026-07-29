export const updateAppBadge = async (count: number) => {
  try {
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        await (navigator as any).setAppBadge(count);
      } else {
        await (navigator as any).clearAppBadge();
      }
    }
  } catch (err) {
    console.warn('App Badging API not supported or failed', err);
  }
};
