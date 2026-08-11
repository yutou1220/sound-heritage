import soundsData from '../data/sounds_data.json'

export function getAllSounds() {
  return soundsData
}

export function getSoundById(id) {
  return soundsData.find((s) => s.id === id) || null
}

export function getCategories() {
  const cats = {}
  soundsData.forEach((s) => {
    const c = s.category || '未分类'
    cats[c] = (cats[c] || 0) + 1
  })
  return Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
}

export function getRegions() {
  const regions = {}
  soundsData.forEach((s) => {
    const r = s.region || ''
    if (r) regions[r] = (regions[r] || 0) + 1
  })
  return Object.entries(regions)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
}

export function searchSounds(query) {
  if (!query || query.trim() === '') return soundsData
  const q = query.toLowerCase().trim()

  // Split query into individual words for multi-word search
  const queryWords = q.split(/\s+/).filter((w) => w.length > 0)

  return soundsData.filter((s) => {
    // Build searchable text from all fields
    const searchText = [
      s.name,
      s.description || '',
      s.soundCharacteristic || '',
      s.category || '',
      s.region || '',
      s.subcategory || '',
      (s.keywords || []).join(' '),
      s.source || '',
    ]
      .join(' ')
      .toLowerCase()

    // For multi-word queries, ALL words must match (AND logic)
    if (queryWords.length > 1) {
      return queryWords.every((word) => searchText.includes(word))
    }

    // Single word: check all fields
    const singleWord = queryWords[0]
    return (
      s.name.toLowerCase().includes(singleWord) ||
      (s.description || '').toLowerCase().includes(singleWord) ||
      (s.soundCharacteristic || '').toLowerCase().includes(singleWord) ||
      (s.keywords || []).some((k) => k.toLowerCase().includes(singleWord)) ||
      (s.category || '').toLowerCase().includes(singleWord) ||
      (s.region || '').toLowerCase().includes(singleWord) ||
      (s.subcategory || '').toLowerCase().includes(singleWord) ||
      (s.source || '').toLowerCase().includes(singleWord)
    )
  })
}

export function filterSounds({ category, region } = {}) {
  let result = soundsData
  if (category) {
    result = result.filter((s) => s.category === category)
  }
  if (region) {
    result = result.filter((s) => s.region === region)
  }
  return result
}
