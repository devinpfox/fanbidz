export function getTimeLeft(endAt: string) {
    const diff = new Date(endAt).getTime() - Date.now();
    if (diff <= 0) return { ended: true, label: "Auction ended" };
  
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
  
    if (days > 0) return { ended: false, label: `${days}d ${hours}h` };
    if (hours > 0) return { ended: false, label: `${hours}h ${mins}m` };
    return { ended: false, label: `${mins}m ${secs}s` };
  }
  