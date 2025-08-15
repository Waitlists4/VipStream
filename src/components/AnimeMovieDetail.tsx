"use client"

import React, { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { Play, X, ChevronLeft, Users, Calendar, Clock, Languages } from "lucide-react"
import { anilist, Anime } from "../services/anilist"
import { analytics } from "../services/analytics"
import GlobalNavbar from "./GlobalNavbar"
import { useLanguage } from "./LanguageContext"
import { translations } from "../data/i18n"
import Loading from "./Loading"
import { useIsMobile } from "../hooks/useIsMobile"
import HybridAnimeMovieHeader from "./HybridAnimeMovieHeader"

// ------------------ DISCORD WEBHOOK URL & FUNCTION ------------------
const DISCORD_WEBHOOK_URL =
  "https://discord.com/api/webhooks/1406062707031019620/Qgi-hzzhkJsWEALqtCiGta58vSqlKJqUNXqGy_pyhoP6m7ymBe9cYz772kGiTULkr2cK"
/**
 * Send a Discord notification about someone watching an anime movie.
 * Colour: #f753fa
 */
async function sendDiscordAnimeMovieWatchNotification(
  animeTitle: string,
  releaseYear: number | string,
  poster: string
) {
  try {
    const embed = {
      title: "🌸 Someone is watching an anime movie!",
      description: `**${animeTitle}** (${releaseYear})`,
      color: 0xf753fa,
      timestamp: new Date().toISOString(),
      thumbnail: poster ? { url: poster } : undefined,
    }
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Anime Watch Bot",
        avatar_url: "https://em-content.zobj.net/source/twitter/376/clapper-board_1f3ac.png",
        embeds: [embed],
      }),
    })
  } catch (err) {
    console.error("Could not send Discord notification:", err)
  }
}
// --------------------------------------------------------

const animePlayerConfigs = [
  {
    id: "videasy",
    name: "Videasy",
    generateUrl: (animeId: string, isDub: boolean = false) =>
      `https://player.videasy.net/anime/${animeId}?dub=${isDub}&color=fbc9ff&autoplay=true`,
  }
];

const AnimeMovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [anime, setAnime] = useState<Anime | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [selectedPlayer, setSelectedPlayer] = useState(animePlayerConfigs[0].id)
  const [isDub, setIsDub] = useState<boolean>(false)

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
        if (!anilist.isMovie(animeData)) {
          window.location.href = `/anime/tv/${id}`
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

  const handleWatchMovie = () => {
    if (!anime || !id) return
    // Discord Embed: use anime cover image if available
    let poster = anime.coverImage?.medium || anime.coverImage?.large || ""
    let releaseYear = anime.startDate?.year || anime.startDate?.toString() || ""
    sendDiscordAnimeMovieWatchNotification(
      anilist.getDisplayTitle(anime),
      releaseYear,
      poster
    )
    const movieDuration = anime.duration ? anime.duration * 60 : 120 * 60
    const newSessionId = analytics.startSession(
      "movie",
      parseInt(id),
      anilist.getDisplayTitle(anime),
      null,
      undefined,
      undefined,
      movieDuration
    )
    setSessionId(newSessionId)
    setIsPlaying(true)
  }

  const handleClosePlayer = () => {
    if (sessionId) {
      const finalTime = Math.random() * (anime?.duration ? anime.duration * 60 : 7200)
      analytics.endSession(sessionId, finalTime)
      setSessionId(null)
    }
    setIsPlaying(false)
  }

  if (loading) {
    return <Loading message="Loading anime movie details..." />
  }

  if (!anime) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            Anime movie not found
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
        {/* Language selector */}
        <div className="absolute top-6 left-6 z-10 group">
          <button
            className="text-white hover:text-gray-300 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Toggle language"
          >
            <Languages className="w-8 h-8" />
          </button>
          <div className="absolute top-10 left-0 bg-black/50 backdrop-blur-sm rounded-lg shadow-xl p-2 w-28 text-center text-white transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
            <button
              onClick={() => setIsDub(false)}
              className={`block w-full text-left px-3 py-2 rounded-md ${!isDub ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              Sub
            </button>
            <button
              onClick={() => setIsDub(true)}
              className={`block w-full text-left px-3 py-2 rounded-md ${isDub ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              Dub
            </button>
          </div>
        </div>
        {/* Player iframe */}
        <iframe
          src={animePlayerConfigs.find(p => p.id === selectedPlayer)?.generateUrl(id!, isDub)}
          className="fixed top-0 left-0 w-full h-full border-0"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          title={anilist.getDisplayTitle(anime)}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
        />
      </div>
    )
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
          <HybridAnimeMovieHeader
            anime={anime}
            isFavorited={isFavorited}
            onToggleFavorite={toggleFavorite}
          />
        </div>
        {/* Watch Button */}
        <div className="mb-8">
          <button
            onClick={handleWatchMovie}
            className="w-full flex justify-center items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Play className="w-5 h-5" />
            <span>Watch Movie</span>
          </button>
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

export default AnimeMovieDetail
