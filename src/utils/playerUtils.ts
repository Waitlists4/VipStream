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

const THEME_COLOR = "fbc9ff"

export const playerConfigs: PlayerConfig[] = [
  {
    id: "vidjoy",
    name: "Vidjoy",
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      const baseUrl = mediaType === "movie"
        ? `https://vidjoy.pro/embed/movie/${tmdbId}`
        : `https://vidjoy.pro/embed/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;
      return `${baseUrl}?autoplay=true&color=${THEME_COLOR}`;
    },
  },
  {
    id: "videasy",
    name: "Videasy",
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      const baseUrl = mediaType === "movie"
        ? `https://player.videasy.net/movie/${tmdbId}`
        : `https://player.videasy.net/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;
      return `${baseUrl}?color=${THEME_COLOR}&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true&noRedirect=true&adblock=true&popup=false&mobile=true&ads=false&redirect=false&popups=false&external=false`;
    },
  },
  {
    id: "vidrock",
    name: "Vidrock",
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      const baseUrl = mediaType === "movie"
        ? `https://vidrock.net/embed/movie/${tmdbId}`
        : `https://vidrock.net/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;
      return `${baseUrl}?autoplay=true&autonext=true&theme=${THEME_COLOR}&download=true`;
    },
  },
  /*{
    id: "multiembed",
    name: "MultiEmbed",
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      const baseUrl = mediaType === "movie"
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${seasonNumber}&e=${episodeNumber}`;
      return `${baseUrl}`;
    },
  },
    {
    id: "smashystream",
    name: "Smashystream",
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      const baseUrl =
        mediaType === "movie"
          ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}`
          : `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&s=${seasonNumber}&e=${episodeNumber}`;
      return `${baseUrl}`;
    },
  },
  {
    id: "vidora",
    name: "Vidora",
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      const baseUrl =
        mediaType === "movie"
          ? `https://vidora.su/movie/${tmdbId}`
          : `https://vidora.su/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;
      return `${baseUrl}`;
    },
  },
  {
    id: "111movies",
    name: "111Movies",
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      const baseUrl =
        mediaType === "movie"
          ? `https://111movies.com/movie/${tmdbId}`
          : `https://111movies.com/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;
      return `${baseUrl}`;
    },
  },
  {
    id: "vidfast",
    name: "Vidfast",
    generateUrl: ({ tmdbId, seasonNumber, episodeNumber, mediaType }) => {
      const baseUrl =
        mediaType === "movie"
          ? `https://vidfast.pro/movie/${tmdbId}`
          : `https://vidfast.pro/tv/${tmdbId}/${seasonNumber}/${episodeNumber}`;
      return `${baseUrl}?autoPlay=true&theme=${THEME_COLOR}&nextButton=true`;
    },
  },*/
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
