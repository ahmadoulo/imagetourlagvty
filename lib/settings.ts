import { prisma } from "./prisma";

// Basic in-memory cache to avoid hitting the DB on every single request
// In a multi-instance edge deployment, you'd use Redis for this.
let settingsCache: Record<string, any> = {};
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export async function getSettings() {
  const now = Date.now();
  if (now - cacheTime < CACHE_TTL && Object.keys(settingsCache).length > 0) {
    return settingsCache;
  }

  const settings = await prisma.systemSetting.findMany();
  const newCache: Record<string, any> = {};
  
  settings.forEach(setting => {
    if (setting.type === "boolean") newCache[setting.key] = setting.value === "true";
    else if (setting.type === "number") newCache[setting.key] = Number(setting.value);
    else if (setting.type === "json") {
      try { newCache[setting.key] = JSON.parse(setting.value); } catch { newCache[setting.key] = null; }
    }
    else newCache[setting.key] = setting.value;
  });

  settingsCache = newCache;
  cacheTime = now;
  
  return settingsCache;
}

export async function clearSettingsCache() {
  settingsCache = {};
  cacheTime = 0;
}
