// In-memory store for live hacker alerts to show to active admins
// Uses globalThis to survive Next.js dev server reloads

if (!globalThis.hackerAlertQueue) {
    globalThis.hackerAlertQueue = [];
}

const MAX_ALERTS = 100;

export function addLiveAlert(alert) {
    const newAlert = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        ...alert
    };
    
    globalThis.hackerAlertQueue.unshift(newAlert);
    
    // Keep array size manageable
    if (globalThis.hackerAlertQueue.length > MAX_ALERTS) {
        globalThis.hackerAlertQueue = globalThis.hackerAlertQueue.slice(0, MAX_ALERTS);
    }
    
    return newAlert;
}

export function getLiveAlerts(since = null) {
    if (!since) {
        // Return recent ones if no 'since' timestamp provided
        return globalThis.hackerAlertQueue.slice(0, 5); 
    }
    
    const sinceTime = new Date(since).getTime();
    return globalThis.hackerAlertQueue.filter(a => new Date(a.timestamp).getTime() > sinceTime);
}
