"use client"

import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Play, X, ChevronLeft, List, Grid, Info, Calendar, Users, Clock } from "lucide-react"
import { anilist, Anime } from "../services/anilist"
import { analytics } from "../services/analytics"
import GlobalNavbar from "./GlobalNavbar"
import { useLanguage } from "./LanguageContext"
import { translations } from "../data/i18n"
import Loading from "./Loading"
import { useIsMobile } from "../hooks/useIsMobile"
import HybridAnimeTVHeader from "./HybridAnimeTVHeader"

// Player configurations for anime
const animePlayerConfigs = [
  {
    id: "videasy",
    name: "Videasy",
    generateUrl: (animeId: string, episode: number = 1) => 
      `https://player.videasy.net/anime/${animeId}/${episode}?color=fbc9ff&autoplay=true&nextEpisode=true`,
  },
  {
    id: "gogoanime",
    name: "GogoAnime",
    generateUrl: (animeId: string, episode: number = 1) => 
      `https://gogoanime.lu/embed/${animeId}-episode-${episode}`,
  },
  {
    id: "9anime",
    name: "9Anime",
    generateUrl: (animeId: string, episode: number = 1) => 
      `https://9anime.to/embed/${animeId}/${episode}`,
  },
];

const AnimeTVDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [anime, setAnime] = useState<Anime | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentEpisode, setCurrentEpisode] = useState<number>(1)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(animePlayerConfigs[0].id)
  const [selectedSeason, setSelectedSeason] = useState(0)
  const [showDescriptions, setShowDescriptions] = useState<{ [key: number]: boolean }>({})

  const { language } = useLanguage()
  const t = translations[language]
  const isMobile = useIsMobile()

  useEffect(() => {
    const fetchAnime = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        const response = await anilist.getAnimeDetails(parseInt(id))
        const animeData = response.data.Media
        
        // Ensure it's a TV show
        if (anilist.isMovie(animeData)) {
          // Redirect to movie detail
          window.location.href = `/anime/movie/${id}`
          return
        }
        
        setAnime(animeData)
      } catch (error) {
        console.error("Failed to fetch anime:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnime()
  }, [id])

  useEffect(() => {
    if (anime) {
      const favorites = JSON.parse(localStorage.getItem("favoriteAnime") || "[]")
      setIsFavorited(favorites.some((fav: any) => fav.id === anime.id))
    }
  }, [anime])

  const toggleFavorite = () => {
    if (!anime) return
    const favorites = JSON.parse(localStorage.getItem("favoriteAnime") || "[]")
    const exists = favorites.some((fav: any) => fav.id === anime.id)
    const updatedFavorites = exists
      ? favorites.filter((fav: any) => fav.id !== anime.id)
      : [...favorites, anime]
    localStorage.setItem("favoriteAnime", JSON.stringify(updatedFavorites))
    setIsFavorited(!exists)
  }

  const handleWatchEpisode = (episodeNumber: number) => {
    if (anime && id) {
      const episodeDuration = anime.duration ? anime.duration * 60 : 24 * 60 // 24 minutes default

      const newSessionId = analytics.startSession(
        "tv", // Use TV type for anime series
        parseInt(id),
        anilist.getDisplayTitle(anime),
        null, // No poster path for anime
        1, // Season 1 for anime
        episodeNumber,
        episodeDuration,
      )
      
      setSessionId(newSessionId)
      setCurrentEpisode(episodeNumber)
      setIsPlaying(true)
    }
  }

  const handleClosePlayer = () => {
    if (sessionId) {
      const episodeDuration = anime?.duration ? anime.duration * 60 : 24 * 60
      const finalTime = Math.random() * episodeDuration
      analytics.endSession(sessionId, finalTime)
      setSessionId(null)
    }
    setIsPlaying(false)
    setCurrentEpisode(1)
  }

  const toggleDescription = (episodeId: number) => {
    setShowDescriptions((prev) => ({
      ...prev,
      [episodeId]: !prev[episodeId],
    }))
  }

  // Generate episode list
  const generateEpisodes = () => {
    if (!anime?.episodes) return []
    
    const episodes = []
    for (let i = 1; i <= anime.episodes; i++) {
      episodes.push({
        id: i,
        episode_number: i,
        name: `Episode ${i}`,
        air_date: '', // AniList doesn't provide individual episode air dates easily
        overview: '', // Would need separate API call for episode details
      })
    }
    return episodes
  }

  const episodes = generateEpisodes()

  if (loading) {
    return <Loading message="Loading anime details..." />
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            Anime not found
          </h2>
          <Link
            to="/anime"
            className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
          >
            Back to Anime
          </Link>
        </div>
      </div>
    )
  }

  if (isPlaying) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        {/* Close button */}
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={handleClosePlayer}
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="Close Player"
          >
            <X className="w-8 h-8" />
          </button>
        </div>

        {/* Player Selector */}
        <div className="absolute top-6 left-6 z-10">
          <div className="bg-black/70 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <h3 className="text-white text-sm font-medium mb-3">Select Player</h3>
            <div className="grid grid-cols-1 gap-2">
              {animePlayerConfigs.map((config) => (
                <button
                  key={config.id}
                  onClick={() => setSelectedPlayer(config.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedPlayer === config.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {config.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Player iframe */}
        <iframe
          src={animePlayerConfigs.find(p => p.id === selectedPlayer)?.generateUrl(id!, currentEpisode)}
          className="fixed top-0 left-0 w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          title={`${anilist.getDisplayTitle(anime)} - Episode ${currentEpisode}`}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <GlobalNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            to="/anime"
            className="text-pink-600 dark:text-pink-400 hover:underline ml-1"
          >
            <ChevronLeft />
          </Link>
          <HybridAnimeTVHeader
            anime={anime}
            selectedSeason={selectedSeason}
            onSeasonChange={setSelectedSeason}
            isFavorited={isFavorited}
            onToggleFavorite={toggleFavorite}
          />
        </div>

        {/* Characters Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-200/50 dark:border-gray-700/50 overflow-hidden mb-8 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white px-8 pt-8 mb-4">Characters & Voice Actors</h2>
          <div className="flex flex-wrap gap-6 px-8 pb-8">
            {anime.characters.edges.length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300">No character information available.</p>
            ) : (
              anime.characters.edges.slice(0, 12).map((edge) => (
                <div key={edge.node.id} className="flex-shrink-0 w-28 text-center">
                  <img
                    src={edge.node.image.large || edge.node.image.medium}
                    alt={edge.node.name.full}
                    className="w-28 h-28 object-cover rounded-full shadow-md mb-2 border border-gray-300 dark:border-gray-600"
                  />
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {edge.node.name.full}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {edge.role}
                  </p>
                  {edge.voiceActors.length > 0 && (
                    <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                      {edge.voiceActors[0].name.full}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Episodes Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-200/50 dark:border-gray-700/50 p-6 transition-colors duration-300">
          <div className={`flex items-center justify-between mb-6 ${isMobile ? "flex-col space-y-4" : ""}`}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
              Episodes ({anime.episodes || 0})
            </h2>
          </div>

          {/* Episodes List */}
          <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className={`group bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 border border-pink-200/50 dark:border-gray-600/50 overflow-hidden hover:shadow-lg transition-all duration-300 ${isMobile ? 'rounded-lg' : 'rounded-xl'}`}
              >
                <div className={isMobile ? 'p-3' : 'p-4'}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {episode.episode_number}
                      </span>
                      <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'} text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors`}>
                        {episode.name}
                      </h3>
                    </div>
                    <div className={`flex items-center space-x-2 ${isMobile ? 'flex-col' : ''}`}>
                      <button
                        onClick={() => handleWatchEpisode(episode.episode_number)}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-3 py-1 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-colors flex items-center space-x-2"
                        title="Watch Episode"
                      >
                        <Play className="w-4 h-4" />
                        <span>Watch</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Relations Section */}
        {anime.relations.edges.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-200/50 dark:border-gray-700/50 p-6 mt-8 transition-colors duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Anime</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {anime.relations.edges.slice(0, 12).map((relation, index) => {
                const relatedAnime = relation.node
                const isMovie = relatedAnime.format === 'MOVIE'
                const path = isMovie ? `/anime/movie/${relatedAnime.id}` : `/anime/tv/${relatedAnime.id}`
                
                return (
                  <Link
                    key={index}
                    to={path}
                    className="group block bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-3 hover:shadow-lg transition-all duration-300"
                  >
                    <img
                      src={relatedAnime.coverImage.medium}
                      alt={anilist.getDisplayTitle(relatedAnime)}
                      className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                    />
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mb-1">
                      {relation.relationType}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                      {anilist.getDisplayTitle(relatedAnime)}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {anime.recommendations.nodes.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-green-200/50 dark:border-gray-700/50 p-6 mt-8 transition-colors duration-300">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recommendations</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {anime.recommendations.nodes.slice(0, 12).map((rec, index) => {
                const recAnime = rec.mediaRecommendation
                const isMovie = recAnime.format === 'MOVIE'
                const path = isMovie ? `/anime/movie/${recAnime.id}` : `/anime/tv/${recAnime.id}`
                
                return (
                  <Link
                    key={index}
                    to={path}
                    className="group block bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 hover:shadow-lg transition-all duration-300"
                  >
                    <img
                      src={recAnime.coverImage.medium}
                      alt={anilist.getDisplayTitle(recAnime)}
                      className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                    />
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {anilist.getDisplayTitle(recAnime)}
                    </p>
                    <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1">{anilist.formatScore(recAnime.averageScore)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnimeTVDetail