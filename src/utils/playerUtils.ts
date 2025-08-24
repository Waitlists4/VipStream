import { tmdb } from "../services/tmdb"

export interface PlayerConfig {
  id: string
  name: string
  generateUrl: (params: {
    tmdbId: string
    seasonNumber?: number
    episodeNumber?: number
    mediaType: "movie" | "tv"
  }) => string
}

export const playerConfigs: PlayerConfig[] = [
  {
    id: "vidnest",
    name: "Vidnest",
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      if (mediaType === "movie") {
        return `https://vidnest.fun/movie/${tmdbId}`;
      } else {
        return `https://vidnest.fun/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;
      }
    },
  }
];

export const getPlayerUrl = (
  playerId: string,
  tmdbId: string,
  mediaType: "movie" | "tv",
  seasonNumber?: number,
  episodeNumber?: number,
): string => {
  const config = playerConfigs.find((p) => p.id === playerId)
  if (!config) {
    throw new Error(`Player ${playerId} not found`)
  }

  return config.generateUrl({
    tmdbId,
    seasonNumber,
    episodeNumber,
    mediaType,
  })
}