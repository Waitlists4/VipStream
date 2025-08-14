"use client"

import React, { useState, useEffect } from "react"
import { Star, Heart, ChevronDown, Clock } from "lucide-react"
import { tmdb } from "../services/tmdb"
import { useLanguage } from "./LanguageContext"
import { translations } from "../data/i18n"
import type { TVDetails, MovieDetails } from "../types"

interface HybridAnimeHeaderProps {
  anime: TVDetails | MovieDetails
  selectedSeason?: number
  onSeasonChange?: (season: number) => void
  isFavorited: boolean
  onToggleFavorite: () => void
  externalData?: {
    romajiTitle?: string
    nativeTitle?: string
    sourceMaterial?: string
    meanScore?: number
    popularity?: number
    studios?: string[]
    status?: string
  }
}

const HybridAnimeHeader: React.FC<HybridAnimeHeaderProps> = ({
  anime,
  selectedSeason = 0,
  onSeasonChange,
  isFavorited,
  onToggleFavorite,
  externalData
}) => {
  const isTV = "number_of_seasons" in anime
  const { language } = useLanguage()
  const t = translations[language] || translations.en
  const [seasonDetails, setSeasonDetails] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // Fetch season details (TV only)
  useEffect(() => {
    if (!isTV || selectedSeason === 0 || !onSeasonChange) return
    const fetchSeasonDetails = async () => {
      setLoading(true)
      try {
        const seasonData = await tmdb.getTVSeasons(anime.id, selectedSeason)
        setSeasonDetails(seasonData)
      } catch (err) {
        console.error("Failed to fetch season details:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchSeasonDetails()
  }, [anime.id, selectedSeason, isTV, onSeasonChange])

  const formatYearRange = (start?: string, end?: string) => {
    if (!start) return t.unknown
    const startYear = new Date(start).getFullYear()
    const endYear = end ? new Date(end).getFullYear() : startYear
    return startYear === endYear ? `${startYear}` : `${startYear}-${endYear}`
  }

  const getDisplayData = () => {
    if (isTV) {
      // TV mode
      if (selectedSeason > 0 && seasonDetails) {
        const episodes = seasonDetails.episodes || []
        return {
          title: `${externalData?.romajiTitle || anime.name || t.untitled} - ${t.season} ${selectedSeason}`,
          nativeTitle: externalData?.nativeTitle || anime.original_name || "",
          overview: seasonDetails.overview || anime.overview || t.no_overview,
          poster: seasonDetails.poster_path || anime.poster_path,
          backdrop: episodes[0]?.still_path || anime.backdrop_path,
          year: formatYearRange(episodes[0]?.air_date, episodes[episodes.length - 1]?.air_date),
          rating: anime.vote_average || 0,
          genres: anime.genres || [],
          episodeCount: episodes.length,
          seasonCount: anime.number_of_seasons || 0,
          studios: externalData?.studios || anime.production_companies?.map(c => c.name) || [],
          sourceMaterial: externalData?.sourceMaterial || t.unknown,
          status: externalData?.status || anime.status || t.unknown,
          runtime: anime.episode_run_time?.[0] || 0
        }
      }
      // TV overview mode
      return {
        title: externalData?.romajiTitle || anime.name || t.untitled,
        nativeTitle: externalData?.nativeTitle || anime.original_name || "",
        overview: anime.overview || t.no_overview,
        poster: anime.poster_path,
        backdrop: anime.backdrop_path,
        year: formatYearRange(anime.first_air_date, anime.last_air_date),
        rating: anime.vote_average || 0,
        genres: anime.genres || [],
        episodeCount: anime.number_of_episodes || 0,
        seasonCount: anime.number_of_seasons || 0,
        studios: externalData?.studios || anime.production_companies?.map(c => c.name) || [],
        sourceMaterial: externalData?.sourceMaterial || t.unknown,
        status: externalData?.status || anime.status || t.unknown,
        runtime: anime.episode_run_time?.[0] || 0
      }
    } else {
      // Movie mode
      return {
        title: externalData?.romajiTitle || (anime as MovieDetails).title || t.untitled,
        nativeTitle: externalData?.nativeTitle || (anime as MovieDetails).original_title || "",
        overview: anime.overview || t.no_overview,
        poster: anime.poster_path,
        backdrop: anime.backdrop_path,
        year: formatYearRange((anime as MovieDetails).release_date),
        rating: anime.vote_average || 0,
        genres: anime.genres || [],
        episodeCount: 1,
        seasonCount: 0,
        studios: externalData?.studios || anime.production_companies?.map(c => c.name) || [],
        sourceMaterial: externalData?.sourceMaterial || t.unknown,
        status: externalData?.status || anime.status || t.unknown,
        runtime: (anime as MovieDetails).runtime || 0
      }
    }
  }

  const displayData = getDisplayData()
  const availableSeasons = isTV ? anime.seasons?.filter(s => s.season_number > 0) || [] : []

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={tmdb.getImageUrl(displayData.backdrop, "w1280") || tmdb.getImageUrl(displayData.poster, "w1280")}
          alt={displayData.title}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-6">
        {/* Poster */}
        <div
          style={{
            backgroundImage: displayData.poster
              ? `url(${tmdb.getImageUrl(displayData.poster, "w500")})`
              : 'linear-gradient(to bottom, rgb(219 39 119), rgb(147 51 234))',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
          className="w-48 h-72 md:w-64 md:h-96 rounded-xl shadow-2xl flex-shrink-0"
        />

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">{displayData.title}</h1>
              {displayData.nativeTitle && <p className="text-lg text-gray-300 italic">{displayData.nativeTitle}</p>}
            </div>
            <button
              onClick={onToggleFavorite}
              className={`p-2 rounded-full transition-colors ${
                isFavorited ? "text-pink-500 bg-pink-500/20" : "text-white hover:text-pink-500 hover:bg-pink-500/20"
              }`}
            >
              <Heart className="w-6 h-6" fill={isFavorited ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
            <div className="flex items-center bg-white/20 px-3 py-1 rounded-full">
              <Star className="w-4 h-4 mr-1 text-yellow-400" />
              <span className="text-white">{displayData.rating.toFixed(1)}</span>
            </div>
            {externalData?.meanScore && <div className="text-pink-400">AniList: {externalData.meanScore}/100</div>}
            <div className="text-gray-300">{displayData.year}</div>
            {isTV && <div className="text-gray-300">{displayData.episodeCount} {t.episodes}</div>}
            {displayData.runtime > 0 && (
              <div className="flex items-center text-gray-300">
                <Clock className="w-4 h-4 mr-1" />
                {displayData.runtime} min
              </div>
            )}
            <div className="text-gray-300">{t.status}: {displayData.status}</div>
          </div>

          {/* Studios */}
          {displayData.studios.length > 0 && (
            <div className="mb-2 text-gray-300">
              <span className="font-semibold">{t.studio}:</span> {displayData.studios.join(", ")}
            </div>
          )}

          {/* Source */}
          <div className="mb-4 text-gray-300">
            <span className="font-semibold">{t.source_material}:</span> {displayData.sourceMaterial}
          </div>

          {/* Season Selector */}
          {isTV && availableSeasons.length > 0 && onSeasonChange && (
            <div className="mb-4 relative season-dropdown">
              <button
                onClick={() => setDropdownOpen(p => !p)}
                className="w-full md:w-64 bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white flex justify-between items-center"
              >
                <span>{selectedSeason === 0 ? t.show_overview : `${t.season} ${selectedSeason}`}</span>
                <ChevronDown className="w-4 h-4 text-white opacity-70" />
              </button>
              {dropdownOpen && (
                <ul className="absolute z-20 mt-2 w-full bg-gray-900/90 border border-white/20 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  <li
                    onClick={() => { onSeasonChange(0); setDropdownOpen(false) }}
                    className={`px-4 py-2 text-white hover:bg-pink-500/20 cursor-pointer ${selectedSeason === 0 ? "bg-white/10" : ""}`}
                  >
                    {t.show_overview}
                  </li>
                  {availableSeasons.map(season => (
                    <li
                      key={season.id}
                      onClick={() => { onSeasonChange(season.season_number); setDropdownOpen(false) }}
                      className={`px-4 py-2 text-white hover:bg-pink-500/20 cursor-pointer ${selectedSeason === season.season_number ? "bg-white/10" : ""}`}
                    >
                      {t.season} {season.season_number}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Overview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">{t.overview}</h3>
            <p className="text-gray-300 leading-relaxed">{displayData.overview}</p>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-2">
            {displayData.genres.map(g => (
              <span key={g.id} className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HybridAnimeHeader
