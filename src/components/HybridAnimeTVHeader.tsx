"use client"

import React, { useState, useEffect } from "react"
import { Star, Heart, ChevronDown, Clock, Calendar, Users } from "lucide-react"
import { anilist, Anime } from "../services/anilist"
import { useLanguage } from "./LanguageContext"
import { translations } from "../data/i18n"

interface HybridAnimeTVHeaderProps {
  anime: Anime
  selectedSeason?: number
  onSeasonChange?: (season: number) => void
  isFavorited: boolean
  onToggleFavorite: () => void
}

const HybridAnimeTVHeader: React.FC<HybridAnimeTVHeaderProps> = ({
  anime,
  selectedSeason = 0,
  onSeasonChange,
  isFavorited,
  onToggleFavorite,
}) => {
  const { language } = useLanguage()
  const t = translations[language] || translations.en
  const [dropdownOpen, setDropdownOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".season-dropdown")) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const displayTitle = anilist.getDisplayTitle(anime)
  const year = anilist.getYear(anime)
  const score = anilist.formatScore(anime.averageScore)
  const duration = anilist.formatDuration(anime.duration)

  // Generate season options based on episode count
  const generateSeasonOptions = () => {
    if (!anime.episodes || anime.episodes <= 12) return []
    
    const seasons = []
    const episodesPerSeason = 12
    const totalSeasons = Math.ceil(anime.episodes / episodesPerSeason)
    
    for (let i = 1; i <= totalSeasons; i++) {
      seasons.push({
        season_number: i,
        name: `Season ${i}`,
        episode_count: i === totalSeasons 
          ? anime.episodes - (i - 1) * episodesPerSeason 
          : episodesPerSeason
      })
    }
    
    return seasons
  }

  const availableSeasons = generateSeasonOptions()

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-purple-900 to-pink-900">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={anime.bannerImage || anime.coverImage.large}
          alt={displayTitle}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
      </div>

      <div className="relative z-10 p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="flex-shrink-0">
            <div className="relative group">
              <div
                style={{
                  backgroundImage: anime.coverImage.large
                    ? `url(${anime.coverImage.large})`
                    : 'linear-gradient(to bottom, rgb(219 39 119), rgb(147 51 234))',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                className="w-48 h-72 md:w-64 md:h-96 rounded-xl shadow-2xl transition-transform group-hover:scale-105"
              />
              {selectedSeason > 0 && (
                <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {t.season} {selectedSeason}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Title and Controls */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {displayTitle}
                </h1>
                {anime.title.native && anime.title.native !== displayTitle && (
                  <p className="text-lg text-gray-300 italic">
                    {anime.title.native}
                  </p>
                )}
              </div>
              <button
                onClick={onToggleFavorite}
                className={`p-2 rounded-full transition-colors ${
                  isFavorited 
                    ? 'text-pink-500 bg-pink-500/20' 
                    : 'text-white hover:text-pink-500 hover:bg-pink-500/20'
                }`}
              >
                <Heart className="w-6 h-6" fill={isFavorited ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Meta Info */}
            <div className="flex items-center space-x-4 mb-4 text-sm">
              <div className="flex items-center bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                <Star className="w-4 h-4 mr-1 text-yellow-400" />
                <span className="text-white">{score}</span>
              </div>
              <div className="text-gray-300">{year}</div>
              {anime.episodes && (
                <div className="text-gray-300">
                  {anime.episodes} {t.episodes}
                </div>
              )}
              {anime.duration && (
                <div className="flex items-center text-gray-300">
                  <Clock className="w-4 h-4 mr-1" />
                  {duration}
                </div>
              )}
            </div>

            {/* Season Selector */}
            {availableSeasons.length > 0 && onSeasonChange && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t.select_season || 'Select Season'}
                </label>
                <div className="relative w-full md:w-64 season-dropdown">
                  <button
                    onClick={() => setDropdownOpen(prev => !prev)}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-white text-left focus:outline-none focus:ring-2 focus:ring-pink-500 flex justify-between items-center"
                  >
                    <span>
                      {selectedSeason === 0
                        ? t.show_overview || "Show Overview"
                        : `${t.season} ${selectedSeason}`}
                    </span>
                    <ChevronDown className="w-4 h-4 text-white opacity-70" />
                  </button>

                  {dropdownOpen && (
                    <ul className="absolute z-20 mt-2 w-full bg-gray-900/90 border border-white/20 backdrop-blur-sm rounded-lg shadow-xl max-h-64 overflow-y-auto">
                      <li
                        onClick={() => {
                          onSeasonChange(0)
                          setDropdownOpen(false)
                        }}
                        className={`px-4 py-2 text-white hover:bg-pink-500/20 cursor-pointer ${
                          selectedSeason === 0 ? "bg-white/10" : ""
                        }`}
                      >
                        {t.show_overview || "Show Overview"}
                      </li>
                      {availableSeasons.map((season) => (
                        <li
                          key={season.season_number}
                          onClick={() => {
                            onSeasonChange(season.season_number)
                            setDropdownOpen(false)
                          }}
                          className={`px-4 py-2 text-white hover:bg-pink-500/20 cursor-pointer ${
                            selectedSeason === season.season_number ? "bg-white/10" : ""
                          }`}
                        >
                          {t.season} {season.season_number} ({season.episode_count} {t.episodes})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* Studios */}
            {anime.studios.nodes.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center text-gray-300 text-sm">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="font-medium">Studio:</span>
                  <span className="ml-2">{anime.studios.nodes.map(s => s.name).join(', ')}</span>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                {t.overview}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {anime.description?.replace(/<[^>]*>/g, '') || t.no_description || 'No description available.'}
              </p>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2">
              {anime.genres.map(genre => (
                <span
                  key={genre}
                  className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HybridAnimeTVHeader