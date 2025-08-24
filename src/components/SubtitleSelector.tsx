"use client"

import React, { useEffect, useState } from "react"
import { fetchSubtitlesByTmdbId } from "../services/subtitles"

interface SubtitleSelectorProps {
  tmdbId: number
  type?: "movie" | "tv"
}

const SubtitleSelector: React.FC<SubtitleSelectorProps> = ({ tmdbId, type = "movie" }) => {
  const [subtitles, setSubtitles] = useState<{ id: string; lang: string; url: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const subs = await fetchSubtitlesByTmdbId(tmdbId, type)
      setSubtitles(subs)
      setLoading(false)
    }
    fetchData()
  }, [tmdbId, type])

  if (loading) return <p className="text-white">Loading subtitles...</p>
  if (subtitles.length === 0) return null

  return (
    <select
      className="bg-black/70 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-pink-500"
      onChange={(e) => {
        if (e.target.value) {
          window.open(e.target.value, "_blank")
        }
      }}
    >
      <option value="">Subtitles</option>
      {subtitles.map((sub) => (
        <option key={sub.id} value={sub.url}>
          {sub.lang.toUpperCase()}
        </option>
      ))}
    </select>
  )
}

export default SubtitleSelector
