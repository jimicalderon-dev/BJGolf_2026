import { useState, useCallback } from 'react'
import { golfCourseApi, saveCourse, isConfigured } from '../lib/supabase'
import { useCourse, extractTees } from '../hooks/useCourse'
import CourseInfoCard from '../components/CourseInfoCard'

// ── Client-side filter (guards against the API returning unfiltered results) ──
function matchesQuery(course, query) {
  if (!query) return true
  const q = query.toLowerCase()
  const fields = [
    course.club_name,
    course.course_name,
    course.name,
    course.location?.city,  course.city,
    course.location?.state, course.state,
    course.location?.country, course.country,
  ]
  return fields.some(f => f && String(f).toLowerCase().includes(q))
}

// ── Search results ──────────────────────────────────────────────
function SearchResultCard({ result, onSelect }) {
  const name    = result.club_name    || result.course_name || result.name || 'Unknown'
  const city    = result.location?.city   ?? result.city   ?? ''
  const state   = result.location?.state  ?? result.state  ?? ''
  const country = result.location?.country ?? result.country ?? ''
  const holes   = result.num_holes ?? 18

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-100 text-sm leading-snug">{name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            📍 {[city, state, country].filter(Boolean).join(', ')}
          </p>
          <p className="text-xs text-slate-600 mt-0.5">⛳ {holes} holes</p>
        </div>
      </div>
      <button
        onClick={() => onSelect(result)}
        className="btn-outline w-full py-2 text-sm justify-center"
      >
        Select This Course →
      </button>
    </div>
  )
}

// ── Detail view ─────────────────────────────────────────────────
function CourseDetail({ courseData, onBack, onSaved }) {
  const allTees    = extractTees(courseData)
  const defaultTee = allTees[0]?.name ?? null
  const [selectedTee, setSelectedTee] = useState(defaultTee)
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const id = await saveCourse(courseData, selectedTee)
    setSaving(false)
    if (id) { setSaved(true); onSaved?.() }
  }

  // Build a temporary "course row" to pass to CourseInfoCard
  const courseRow = {
    id:           String(courseData.id ?? ''),
    name:         courseData.club_name || courseData.course_name || courseData.name || 'Course',
    data:         courseData,
    selected_tee: selectedTee,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-outline px-3 py-1.5 text-sm">← Back</button>
        <p className="text-xs text-slate-500 uppercase tracking-widest">Course Detail</p>
      </div>

      <CourseInfoCard
        course={courseRow}
        tees={allTees}
        selectedTee={selectedTee}
        onTeeChange={setSelectedTee}
        compact={false}
      />

      {isConfigured && (
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className="btn-gold w-full py-3 justify-center text-base"
          style={{ opacity: saving || saved ? 0.8 : 1 }}
        >
          {saving ? '⏳ Saving…' : saved ? '✅ Course Saved!' : '⛳ Use This Course for BJ 2026'}
        </button>
      )}

      {!isConfigured && (
        <p className="text-center text-xs text-slate-600">
          Connect Supabase to save course data and use it across the app
        </p>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function Course() {
  const { course, tees, selectedTee, loading, reload } = useCourse()

  const PAGE_SIZE = 50

  const [query,        setQuery]        = useState('')
  const [searching,    setSearching]    = useState(false)
  const [results,      setResults]      = useState(null) // null = not searched yet
  const [searchError,  setSearchError]  = useState('')
  const [detailData,   setDetailData]   = useState(null) // full API course object
  const [fetchingDetail, setFetchingDetail] = useState(false)

  // Pagination state
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const search = useCallback(async () => {
    const q = query.trim()
    if (!q) return

    setSearching(true)
    setSearchError('')
    setResults(null)
    setDetailData(null)

    // reset paging
    setPage(1)
    setMeta(null)

    try {
      const data = await golfCourseApi('', { search: q, page: 1, page_size: PAGE_SIZE })
      const list = data.courses ?? data.data ?? data ?? []
      const raw  = Array.isArray(list) ? list : []
      setResults(raw.filter(c => matchesQuery(c, q)))
      setMeta(data.metadata ?? null)
    } catch (err) {
      setSearchError(err.message || 'Search failed')
      setResults([])
      setMeta(null)
    } finally {
      setSearching(false)
    }
  }, [query])

  const loadMore = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    if (searching || loadingMore) return
    if (!meta) return
    if (meta.current_page >= meta.last_page) return

    const nextPage = page + 1
    setLoadingMore(true)
    setSearchError('')

    try {
      const data = await golfCourseApi('', { search: q, page: nextPage, page_size: PAGE_SIZE })
      const list = data.courses ?? data.data ?? data ?? []
      const more = (Array.isArray(list) ? list : []).filter(c => matchesQuery(c, q))

      setResults(prev => [...(prev ?? []), ...more])
      setMeta(data.metadata ?? meta)
      setPage(nextPage)
    } catch (err) {
      setSearchError(err.message || 'Load more failed')
    } finally {
      setLoadingMore(false)
    }
  }, [query, meta, page, searching, loadingMore])

  const selectCourse = useCallback(async (summary) => {
    setFetchingDetail(true)
    setDetailData(null)
    try {
      const data = await golfCourseApi(String(summary.id))
      // API may return { course: {...} } or the object directly
      setDetailData(data.course ?? data)
    } catch (err) {
      setSearchError(err.message || 'Failed to load course details')
    }
    setFetchingDetail(false)
  }, [])

  // If the user just saved a course, reload it
  const handleSaved = () => {
    setDetailData(null)
    setResults(null)
    reload()
  }

  // ── Render ──
  return (
    <div className="p-4 pb-6 space-y-4">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">GolfCourseAPI</p>
        <h1 className="page-title mt-0.5">Course ⛳</h1>
      </div>

      {/* Active course (stored in Supabase) */}
      {!loading && course && !detailData && (
        <div className="space-y-2">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Active Course</p>
          <CourseInfoCard
            course={course}
            tees={tees}
            selectedTee={selectedTee}
            onTeeChange={() => {}}
            compact={false}
          />
        </div>
      )}

      {/* Detail view */}
      {detailData && (
        <CourseDetail
          courseData={detailData}
          onBack={() => { setDetailData(null) }}
          onSaved={handleSaved}
        />
      )}

      {/* Search section */}
      {!detailData && (
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.15)' }}
        >
          <p className="text-sm font-semibold text-slate-200 mb-3">
            {course ? '🔄 Change Course' : '🔍 Search for a Course'}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Course name or city…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0' }}
            />
            <button
              onClick={search}
              disabled={searching || !query.trim()}
              className="btn-gold px-4 py-2 text-sm disabled:opacity-40"
            >
              {searching ? '…' : 'Search'}
            </button>
          </div>

          {!isConfigured && (
            <p className="text-xs text-amber-500/80 mt-2">
              ⚠️ Deploy the Supabase Edge Function and connect Supabase to search courses
            </p>
          )}
        </div>
      )}

      {/* Fetching detail spinner */}
      {fetchingDetail && (
        <p className="text-center text-slate-400 text-sm py-4">Loading course details…</p>
      )}

      {/* Search error */}
      {searchError && (
        <p className="text-center text-red-400 text-sm py-2">{searchError}</p>
      )}

      {/* Search results */}
      {!detailData && results !== null && (
        <div className="space-y-3">
          {results.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-4">No courses found. Try a different search term.</p>
          ) : (
            <>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                {meta?.total_records ? `${meta.total_records} total` : `${results.length} loaded`}
              </p>

              {results.map((r, i) => (
                <SearchResultCard key={r.id ?? i} result={r} onSelect={selectCourse} />
              ))}

              {meta && meta.current_page < meta.last_page && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="btn-outline w-full py-2 text-sm justify-center"
                  style={{ opacity: loadingMore ? 0.7 : 1 }}
                >
                  {loadingMore ? 'Loading…' : 'Load more courses'}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Loading placeholder */}
      {loading && (
        <p className="text-center text-slate-500 text-sm py-6">Loading active course…</p>
      )}
    </div>
  )
}