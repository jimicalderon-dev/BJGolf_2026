import { useState, useEffect } from 'react'
import { fetchActiveCourse } from '../lib/supabase'
import { HOLES } from '../constants/course'

/**
 * Normalise a tee entry from the GolfCourseAPI response into the
 * internal { number, par, yards, si } format used everywhere in the app.
 *
 * GolfCourseAPI returns holes nested under tees[gender][n].holes[]:
 *   { hole_number, par, yardage, handicap }
 */
function normaliseTeeHoles(teeHoles = []) {
  return teeHoles
    .slice()
    .sort((a, b) => a.hole_number - b.hole_number)
    .map(h => ({
      number: h.hole_number,
      par:    h.par,
      yards:  h.yardage ?? h.yards ?? 0,
      si:     h.handicap ?? h.si ?? 0,
    }))
}

/**
 * Collect all tee boxes from the API data into a flat array:
 *   [{ name, color, par, yardage, slope, rating, holes[] }]
 */
export function extractTees(courseData) {
  const tees = []
  if (!courseData?.tees) return tees
  Object.values(courseData.tees).forEach(genderTees => {
    if (!Array.isArray(genderTees)) return
    genderTees.forEach(t => {
      tees.push({
        name:    t.tee_name ?? t.name ?? 'Unknown',
        color:   (t.tee_name ?? t.name ?? '').toLowerCase(),
        par:     t.par ?? 72,
        yardage: t.yardage ?? t.total_yards ?? 0,
        slope:   t.slope_rating ?? t.slope ?? null,
        rating:  t.course_rating ?? t.rating ?? null,
        holes:   normaliseTeeHoles(t.holes ?? []),
      })
    })
  })
  return tees
}

/**
 * useCourse — reads the active course from Supabase.
 * Falls back to the static HOLES constant when no course is stored.
 *
 * Returns:
 *   course       — raw Supabase row (null if none)
 *   holes        — array of { number, par, yards, si }
 *   tees         — all tee boxes extracted from course data
 *   selectedTee  — tee name string
 *   loading      — boolean
 *   reload       — function to re-fetch
 */
export function useCourse() {
  const [course,      setCourse]      = useState(null)
  const [holes,       setHoles]       = useState(HOLES)
  const [tees,        setTees]        = useState([])
  const [selectedTee, setSelectedTee] = useState(null)
  const [loading,     setLoading]     = useState(true)

  const load = () => {
    setLoading(true)
    fetchActiveCourse().then(({ course: row, selectedTee: tee }) => {
      if (row?.data) {
        setCourse(row)
        setSelectedTee(tee)
        const allTees = extractTees(row.data)
        setTees(allTees)
        const activeTee = allTees.find(t => t.name === tee) ?? allTees[0]
        if (activeTee?.holes?.length === 18) {
          setHoles(activeTee.holes)
        }
      }
      setLoading(false)
    })
  }

  useEffect(load, [])

  return { course, holes, tees, selectedTee, loading, reload: load }
}
