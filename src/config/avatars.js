// src/config/avatars.js
// All avatars are bundled as local app assets — zero Supabase storage/bandwidth cost.
// Only the selected avatar KEY (e.g. "male_3") is stored in the DB.

export const AVATARS = [
  // ── Male / Men ─────────────────────────────────────────────
  { key: 'male_1',   label: 'Gym Guy',      category: 'male',   source: require('../../assets/avatars/male_1.jpg') },
  { key: 'male_2',   label: 'Curly',        category: 'male',   source: require('../../assets/avatars/male_2.jpg') },
  { key: 'male_3',   label: 'Powerhouse',   category: 'male',   source: require('../../assets/avatars/male_3.jpg') },
  { key: 'male_4',   label: 'Headphones',   category: 'male',   source: require('../../assets/avatars/male_4.jpg') },
  { key: 'male_5',   label: 'Hoodie',       category: 'male',   source: require('../../assets/avatars/male_5.jpg') },
  { key: 'male_6',   label: 'Back Day',     category: 'male',   source: require('../../assets/avatars/male_6.jpg') },
  // ── Female / Women ─────────────────────────────────────────
  { key: 'female_1', label: 'Gym Queen',    category: 'female', source: require('../../assets/avatars/female_1.jpg') },
  { key: 'female_2', label: 'Side Strong',  category: 'female', source: require('../../assets/avatars/female_2.jpg') },
  { key: 'female_3', label: 'Lift Girl',    category: 'female', source: require('../../assets/avatars/female_3.jpg') },
  { key: 'female_4', label: 'Beats',        category: 'female', source: require('../../assets/avatars/female_4.jpg') },
  { key: 'female_5', label: 'Iron Lady',    category: 'female', source: require('../../assets/avatars/female_5.jpg') },
  { key: 'female_6', label: 'Pink Power',   category: 'female', source: require('../../assets/avatars/female_6.jpg') },
];

/** Returns the source (require()) for a given avatar key, or null */
export function getAvatarSource(key) {
  return AVATARS.find(a => a.key === key)?.source ?? null;
}
