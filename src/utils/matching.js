// src/utils/matching.js
import archetypesRaw from '@/data/archetypes.json';

function getArchetypesArray(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw?.archetypes && Array.isArray(raw.archetypes)) return raw.archetypes;
  if (raw?.data && Array.isArray(raw.data)) return raw.data;
  const firstKey = raw && typeof raw === 'object' ? Object.keys(raw)[0] : null;
  if (firstKey && Array.isArray(raw[firstKey])) return raw[firstKey];
  return [];
}

// Евклідова відстань між векторами
function calculateDistance(vecA, vecB) {
  let distance = 0;
  for (const key in vecA) {
    if (key in vecB) {
      distance += Math.pow(vecA[key] - vecB[key], 2);
    }
  }
  return Math.sqrt(distance);
}

// простий clamp (щоб не вилітати в -20..170 і т.д.)
function clamp01(x, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, x));
}

function clampVector(vec) {
  const out = { ...vec };
  for (const k in out) out[k] = clamp01(out[k]);
  return out;
}

/**
 * Стабільний псевдорандом 0..1 з рядка (seed)
 * (щоб при F5 результат не змінювався)
 */
function seededRandom01(seedStr) {
  // FNV-1a 32-bit
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // до 0..1
  return (h >>> 0) / 4294967296;
}

/**
 * Вибір з вагами exp(-d/temp)
 */
function weightedPick(topList, seedStr, temp = 25) {
  // topList: [{ archetype, distance }]
  const weights = topList.map((x) => Math.exp(-x.distance / temp));
  const sum = weights.reduce((a, b) => a + b, 0) || 1;

  const r = seededRandom01(seedStr);
  let acc = 0;

  for (let i = 0; i < topList.length; i++) {
    acc += weights[i] / sum;
    if (r <= acc) return topList[i];
  }
  return topList[topList.length - 1];
}

/**
 * userVector: { dominance, empathy, possessiveness, social_status, chaos, darkness }
 * options: {
 *   partnerGender?: 'male' | 'female',
 *   topN?: number,          // скільки топ-варіантів брати (рекомендую 5)
 *   temperature?: number,   // "м’якість" вибору (20..35 ок)
 *   stable?: boolean        // true = не міняється при F5
 * }
 */
export function findBestMatch(userVector, options = {}) {
  const all = getArchetypesArray(archetypesRaw);

  // ✅ Нормалізуємо вектор (щоб алгоритм був стабільніший)
  const v = clampVector(userVector);

  const wanted = (options.partnerGender || '').toLowerCase();
  let pool = all;

  if (wanted === 'male' || wanted === 'female') {
    const filtered = all.filter(
      (a) => String(a?.gender_affinity || '').toLowerCase() === wanted
    );
    if (filtered.length > 0) pool = filtered;
  }

  const topN = Number(options.topN || 5);          // <-- тут можеш змінити 5 на 3/7
  const temperature = Number(options.temperature || 25); // <-- 20 = ближче до топ1, 35 = більше різноманіття
  const stable = options.stable !== false;         // default true

  // збираємо всі відстані
  const scored = [];
  for (const archetype of pool) {
    const traits = archetype?.traits;
    if (!traits) continue;
    scored.push({
      archetype,
      distance: calculateDistance(v, traits),
    });
  }

  if (scored.length === 0) return null;

  // топ-N найближчих
  scored.sort((a, b) => a.distance - b.distance);
  const top = scored.slice(0, Math.max(1, Math.min(topN, scored.length)));

  // ✅ Вибір:
  // - якщо stable=true: seeded weighted pick (не змінюється при F5)
  // - якщо stable=false: random weighted pick (може змінюватись)
  let chosen;
  if (stable) {
    const seedStr = `${wanted || 'any'}:${JSON.stringify(v)}:${top.map(x => x.archetype.id).join(',')}`;
    chosen = weightedPick(top, seedStr, temperature);
  } else {
    // не рекомендую, але лишив як опцію
    const weights = top.map((x) => Math.exp(-x.distance / temperature));
    const sum = weights.reduce((a, b) => a + b, 0) || 1;
    let r = Math.random();
    let acc = 0;
    for (let i = 0; i < top.length; i++) {
      acc += weights[i] / sum;
      if (r <= acc) { chosen = top[i]; break; }
    }
    if (!chosen) chosen = top[top.length - 1];
  }

  const bestDistance = chosen.distance;
  const bestMatch = chosen.archetype;

  // compatibility як і було
  const maxDistance = Math.sqrt(Object.keys(v).length * Math.pow(100, 2));
  const compatibility = Math.max(0, 100 - (bestDistance / maxDistance) * 100);

  return { ...bestMatch, compatibility: Math.round(compatibility) };
}
