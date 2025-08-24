import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { tmdb } from "../services/tmdb"
import { playerConfigs } from "../config/playerConfigs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface AnimeDetail {
  id: number
  title: string
  name?: string
  overview: string
  poster_path: string
  backdrop_path: string
  release_date?: string
  first_air_date?: string
  runtime?: number
  episode_run_time?: number[]
  number_of_seasons?: number
  number_of_episodes?: number
  genres: { id: number; name: string }[]
}

export default function AnimeMovieDetail() {
  const { id } = useParams<{ id: string }>()
  const [anime, setAnime] = useState<AnimeDetail | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState(playerConfigs[0])
  const [selectedSeason, setSelectedSeason] = useState<number>(1)
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1)
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie")

  useEffect(() => {
    async function fetchData() {
      try {
        const movieData = await tmdb.details(id!, "movie")
        if (movieData) {
          setMediaType("movie")
          setAnime(movieData)
        } else {
          const tvData = await tmdb.details(id!, "tv")
          setMediaType("tv")
          setAnime(tvData)
        }
      } catch (error) {
        console.error("Error fetching anime details:", error)
      }
    }
    fetchData()
  }, [id])

  if (!anime) return <div className="p-6 text-center">Loading...</div>

  const title = anime.title || anime.name
  const releaseDate = anime.release_date || anime.first_air_date
  const runtime =
    anime.runtime ||
    (anime.episode_run_time?.length ? anime.episode_run_time[0] : null)

  const videoUrl = selectedPlayer.generateUrl({
    tmdbId: anime.id.toString(),
    seasonNumber: mediaType === "tv" ? selectedSeason : undefined,
    episodeNumber: mediaType === "tv" ? selectedEpisode : undefined,
    mediaType,
  })

  return (
    <div className="p-6 space-y-6">
      {/* Hero Section */}
      <div
        className="relative w-full h-80 rounded-2xl shadow-lg bg-cover bg-center"
        style={{
          backgroundImage: `url(https://image.tmdb.org/t/p/original${anime.backdrop_path})`,
        }}
      >
        <div className="absolute inset-0 bg-black/50 rounded-2xl" />
        <div className="absolute bottom-6 left-6 z-10">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-200">
            {releaseDate?.slice(0, 4)} • {runtime ? `${runtime}m` : ""}{" "}
            {mediaType === "tv"
              ? `• ${anime.number_of_seasons} season${
                  anime.number_of_seasons! > 1 ? "s" : ""
                }`
              : ""}
          </p>
          <div className="flex gap-2 mt-2">
            {anime.genres?.map((g) => (
              <span
                key={g.id}
                className="px-2 py-1 text-xs rounded-full bg-white/20 text-white"
              >
                {g.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Overview */}
      <Card className="bg-card shadow-md rounded-2xl">
        <CardContent className="p-4">
          <p className="text-muted-foreground">{anime.overview}</p>
        </CardContent>
      </Card>

      {/* Player */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {playerConfigs.map((player) => (
            <Button
              key={player.id}
              variant={
                selectedPlayer.id === player.id ? "default" : "secondary"
              }
              onClick={() => setSelectedPlayer(player)}
            >
              {player.name}
            </Button>
          ))}
        </div>

        {mediaType === "tv" && (
          <div className="flex gap-4 items-center">
            <label>
              Season:{" "}
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="p-1 rounded-md border"
              >
                {Array.from({ length: anime.number_of_seasons || 1 }).map(
                  (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  )
                )}
              </select>
            </label>
            <label>
              Episode:{" "}
              <select
                value={selectedEpisode}
                onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                className="p-1 rounded-md border"
              >
                {Array.from({ length: anime.number_of_episodes || 1 }).map(
                  (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        )}

        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-md">
          <iframe
            src={videoUrl}
            className="w-full h-full"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  )
}
