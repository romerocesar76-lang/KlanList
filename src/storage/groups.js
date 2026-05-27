import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_GROUPS_KEY = 'kl_savedGroups';

function normalizeGroup(group) {
  const code = group?.code?.trim?.().toUpperCase?.() || '';
  const name = group?.name?.trim?.() || '';
  if (!code || !name) return null;
  return { code, name };
}

export async function getSavedGroups() {
  try {
    const raw = await AsyncStorage.getItem(SAVED_GROUPS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeGroup).filter(Boolean);
  } catch (e) {
    console.warn('getSavedGroups failed', e);
    return [];
  }
}

export async function saveGroup(group) {
  const nextGroup = normalizeGroup(group);
  if (!nextGroup) return [];

  const current = await getSavedGroups();
  const withoutDuplicate = current.filter(g => g.code !== nextGroup.code);
  const next = [nextGroup, ...withoutDuplicate];
  await AsyncStorage.setItem(SAVED_GROUPS_KEY, JSON.stringify(next));
  return next;
}
