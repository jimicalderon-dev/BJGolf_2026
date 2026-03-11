import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isConfigured = Boolean(
  SUPABASE_URL && SUPABASE_KEY &&
  SUPABASE_URL !== 'your_project_url_here' &&
  SUPABASE_KEY !== 'your_anon_key_here'
)

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null

// ── Players ───────────────────────────────────────────────────
export async function fetchPlayers() {
  if (!supabase) return []
  const { data, error } = await supabase.from('players').select('*').order('name')
  if (error) { console.error('fetchPlayers:', error.message); return [] }
  return data ?? []
}

// ── Events ────────────────────────────────────────────────────
export async function fetchEvents() {
  if (!supabase) return []
  const { data } = await supabase.from('events').select('*').order('day')
  return data ?? []
}

// ── Scores ────────────────────────────────────────────────────
/**
 * Fetch scores for one event.
 * Returns { [player_id]: { [hole_number]: strokes } }
 */
export async function fetchScores(eventId) {
  if (!supabase || !eventId) return {}
  const { data, error } = await supabase
    .from('scores')
    .select('player_id, hole_number, strokes')
    .eq('event_id', eventId)
  if (error) { console.error('fetchScores:', error.message); return {} }
  const result = {}
  ;(data ?? []).forEach(({ player_id, hole_number, strokes }) => {
    if (!result[player_id]) result[player_id] = {}
    result[player_id][hole_number] = strokes
  })
  return result
}

/**
 * Fetch all events' scores.
 * Returns { [event_id]: { [player_id]: { [hole_number]: strokes } } }
 */
export async function fetchAllScores() {
  if (!supabase) return {}
  const { data, error } = await supabase
    .from('scores')
    .select('event_id, player_id, hole_number, strokes')
  if (error) { console.error('fetchAllScores:', error.message); return {} }
  const result = {}
  ;(data ?? []).forEach(({ event_id, player_id, hole_number, strokes }) => {
    if (!result[event_id]) result[event_id] = {}
    if (!result[event_id][player_id]) result[event_id][player_id] = {}
    result[event_id][player_id][hole_number] = strokes
  })
  return result
}

/** Upsert a single hole score (with optional putts + fairway). Returns error or null. */
export async function upsertHoleScore(playerId, eventId, holeNumber, strokes, putts, fairwayHit) {
  if (!supabase) return new Error('Supabase not configured')
  const payload = {
    player_id:   playerId,
    event_id:    eventId,
    hole_number: holeNumber,
    strokes,
    updated_at:  new Date().toISOString(),
  }
  if (putts      !== undefined) payload.putts       = putts
  if (fairwayHit !== undefined) payload.fairway_hit = fairwayHit
  const { error } = await supabase.from('scores').upsert(
    payload,
    { onConflict: 'player_id,event_id,hole_number' }
  )
  return error ?? null
}

/**
 * Fetch per-hole stats (putts, fairway_hit) for one player in one event.
 * Returns { [hole_number]: { putts, fairway_hit } }
 * Does NOT change the shape of fetchScores — safe for existing consumers.
 */
export async function fetchHoleStats(eventId, playerId) {
  if (!supabase || !eventId || !playerId) return {}
  const { data, error } = await supabase
    .from('scores')
    .select('hole_number, putts, fairway_hit')
    .eq('event_id', eventId)
    .eq('player_id', playerId)
  if (error) { console.error('fetchHoleStats:', error.message); return {} }
  const result = {}
  ;(data ?? []).forEach(({ hole_number, putts, fairway_hit }) => {
    result[hole_number] = { putts: putts ?? null, fairway_hit: fairway_hit ?? null }
  })
  return result
}

// ── Chat ──────────────────────────────────────────────────────
export async function fetchMessages(limit = 150) {
  if (!supabase) return []
  const { data } = await supabase
    .from('chat_messages')
    .select('id, player_id, message, created_at, players(name, avatar, team)')
    .order('created_at', { ascending: true })
    .limit(limit)
  return data ?? []
}

export async function insertMessage(playerId, message) {
  if (!supabase) return new Error('Supabase not configured')
  const { error } = await supabase.from('chat_messages').insert({ player_id: playerId, message })
  return error ?? null
}

// ── Notifications ─────────────────────────────────────────────
export async function insertNotification(type, message, playerId) {
  if (!supabase) return null
  const { error } = await supabase
    .from('notifications')
    .insert({ type, message, player_id: playerId, read: false })
  return error ?? null
}

// ── Challenge Results ─────────────────────────────────────────
export async function fetchChallengeResults() {
  if (!supabase) return []
  const { data } = await supabase
    .from('challenge_results')
    .select('id, challenge_id, player_id, value, created_at, players(name, avatar, team)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function insertChallengeResult(challengeId, playerId, value) {
  if (!supabase) return null
  const { error } = await supabase
    .from('challenge_results')
    .insert({ challenge_id: challengeId, player_id: playerId, value })
  return error ?? null
}

// ── Course Data ───────────────────────────────────────────────

/** Call the golf-course Edge Function proxy */
export async function golfCourseApi(path = '', params = {}) {
  const fnUrl = `${SUPABASE_URL}/functions/v1/golf-course`
  const url = new URL(path ? `${fnUrl}/${path}` : fnUrl)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`Golf API error: ${res.status}`)
  return res.json()
}

/** Fetch the active course + its settings from Supabase */
export async function fetchActiveCourse() {
  if (!supabase) return { course: null, selectedTee: null }
  const { data: settings } = await supabase
    .from('tournament_settings')
    .select('active_course_id, courses(*)')
    .eq('id', 1)
    .single()
  if (!settings?.courses) return { course: null, selectedTee: null }
  return {
    course: settings.courses,
    selectedTee: settings.courses.selected_tee,
  }
}

/** Save a course from the API to Supabase and mark it as active */
export async function saveCourse(courseData, selectedTee) {
  if (!supabase) return null
  const id = String(courseData.id)
  const name =
    courseData.club_name ||
    courseData.course_name ||
    courseData.name ||
    'Unknown Course'

  const { error: upsertErr } = await supabase.from('courses').upsert(
    { id, name, data: courseData, selected_tee: selectedTee },
    { onConflict: 'id' }
  )
  if (upsertErr) { console.error('saveCourse:', upsertErr.message); return null }

  const { error: settingsErr } = await supabase.from('tournament_settings').upsert(
    { id: 1, active_course_id: id, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )
  if (settingsErr) { console.error('saveCourse (settings):', settingsErr.message); return null }
  return id
}

/** Update just the selected tee for the active course */
export async function updateSelectedTee(courseId, tee) {
  if (!supabase) return
  await supabase.from('courses').update({ selected_tee: tee }).eq('id', courseId)
}

// ── Tee Times ─────────────────────────────────────────────────

/** Returns { [player_id]: tee_time_number } for an event */
export async function fetchTeeTimes(eventId) {
  if (!supabase || !eventId) return {}
  const { data, error } = await supabase
    .from('tee_times')
    .select('player_id, tee_time')
    .eq('event_id', eventId)
  if (error) { console.error('fetchTeeTimes:', error.message); return {} }
  const result = {}
  ;(data ?? []).forEach(({ player_id, tee_time }) => { result[player_id] = tee_time })
  return result
}

/** Upsert a player's tee time for a round */
export async function upsertTeeTime(playerId, eventId, teeTime) {
  if (!supabase) return new Error('Supabase not configured')
  const { error } = await supabase.from('tee_times').upsert(
    { player_id: playerId, event_id: eventId, tee_time: teeTime },
    { onConflict: 'player_id,event_id' }
  )
  return error ?? null
}

// ── Photos ────────────────────────────────────────────────────
export async function fetchPhotos(day = null) {
  if (!supabase) return []
  let query = supabase
    .from('photos')
    .select('id, player_id, image_url, caption, day, created_at, players(name, avatar, team)')
    .order('created_at', { ascending: false })
  if (day !== null) query = query.eq('day', day)
  const { data } = await query
  return data ?? []
}

export async function uploadPhoto(file, playerId, caption, day) {
  if (!supabase) return null
  const ext      = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error: uploadError } = await supabase.storage.from('photos').upload(fileName, file)
  if (uploadError) { console.error('uploadPhoto:', uploadError.message); return null }
  const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(fileName)
  const { error } = await supabase.from('photos').insert({
    player_id: playerId,
    image_url: publicUrl,
    caption,
    day,
  })
  return error ? null : publicUrl
}
