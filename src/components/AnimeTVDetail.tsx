import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { anilist } from '../services/anilist';
import Loading from './Loading';
import { ChevronLeft, ChevronDown } from 'lucide-react';

interface Anime {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  description: string;
  bannerImage: string;
  averageScore: number;
  popularity: number;
  episodes: number;
  duration: number;
  status: string;
  format: string;
  source: string;
  genres: string[];
  studios: { nodes: { name: string }[] };
  season: string;
  seasonYear: number;
  relations: {
    edges: {
      relationType: string;
      node: {
        id: number;
        title: { romaji: string; english: string };
      };
    }[];
  };
  recommendations: {
    nodes: {
      mediaRecommendation: {
        id: number;
        title: { romaji: string; english: string };
        averageScore: number;
      };
    }[];
  };
}

const AnimeTVDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<'sub' | 'dub'>('sub');
  const [selectedQuality, setSelectedQuality] = useState<'720p' | '1080p' | '4K'>('1080p');
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const data = await anilist.getAnimeDetails(parseInt(id));
        const animeData = data.data.Media;

        // Ensure it's a TV show
        const tvFormats = ['TV', 'TV_SHORT', 'OVA', 'ONA'];
        if (!tvFormats.includes(animeData.format)) {
          setError('This is not a TV show. Redirecting to movie detail page...');
          setTimeout(() => navigate(`/anime/movie/${id}`), 2000);
          return;
        }

        setAnime(animeData);
      } catch (err) {
        setError('Failed to load anime details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnimeDetails();
  }, [id, navigate]);

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500 text-center p-8">{error}</div>;
  if (!anime) return <div className="text-center p-8">Anime not found</div>;

  const formatDuration = (duration: number) => {
    if (duration < 60) return `${duration}m`;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={anime.bannerImage || 'https://via.placeholder.com/1280x720'}
          alt={anime.title.english || anime.title.romaji}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <img
              src={`https://via.placeholder.com/300x450`}
              alt={anime.title.english || anime.title.romaji}
              className="w-64 h-96 rounded-lg shadow-xl"
            />
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">
              {anime.title.english || anime.title.romaji}
            </h1>
            <p className="text-xl text-gray-400 mb-4">{anime.title.romaji}</p>

            <div className="flex flex-wrap gap-4 mb-4">
              <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                Score: {anime.averageScore || 'N/A'}
              </span>
              <span className="bg-pink-600 px-3 py-1 rounded-full text-sm">
                {anime.format}
              </span>
              <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                {anime.episodes} episodes
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                  <span
                    key={genre}
                    className="bg-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Studios</h3>
              <p className="text-gray-300">
                {anime.studios.nodes.map((s) => s.name).join(', ')}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Status</h3>
              <p className="text-gray-300">{anime.status}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Season</h3>
              <p className="text-gray-300">
                {anime.season} {anime.seasonYear}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {anime.description?.replace(/<[^>]*>/g, '') ||
                  'No description available'}
              </p>
            </div>
          </div>
        </div>

        {/* Episode Selector & Player */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Episodes</h2>

          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Select Episode</h3>
              <div className="relative">
                <button
                  onClick={() => setShowEpisodeSelector(!showEpisodeSelector)}
                  className="bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-600 transition-colors"
                >
                  Episode {selectedEpisode}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showEpisodeSelector && (
                  <div className="absolute right-0 mt-2 bg-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-10">
                    {Array.from({ length: anime.episodes || 1 }, (_, i) => i + 1).map((ep) => (
                      <button
                        key={ep}
                        onClick={() => {
                          setSelectedEpisode(ep);
                          setShowEpisodeSelector(false);
                        }}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-600 transition-colors ${
                          selectedEpisode === ep ? 'bg-purple-600' : ''
                        }`}
                      >
                        Episode {ep}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Player Settings</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedAudio('sub')}
                  className={`px-3 py-1 rounded ${
                    selectedAudio === 'sub'
                      ? 'bg-purple-600'
                      : 'bg-gray-700'
                  } hover:bg-purple-700 transition-colors`}
                >
                  Sub
                </button>
                <button
                  onClick={() => setSelectedAudio('dub')}
                  className={`px-3 py-1 rounded ${
                    selectedAudio === 'dub'
                      ? 'bg-purple-600'
                      : 'bg-gray-700'
                  } hover:bg-purple-700 transition-colors`}
                >
                  Dub
                </button>
              </div>
            </div>

            {/* Video Player */}
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <iframe
                src={`https://player.videasy.net/anime/${anime.id}/${selectedEpisode}?dub=${selectedAudio === 'dub'}`}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                title={`${anime.title.english || anime.title.romaji} - Episode ${selectedEpisode} (${selectedAudio === 'sub' ? 'Subbed' : 'Dubbed'})`}
                className="w-full h-full"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
              />
            </div>
          </div>
        </div>

        {/* Relations Section */}
        {anime.relations.edges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Related Anime</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {anime.relations.edges.map((relation, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => navigate(`/anime/${relation.node.id}`)}
                >
                  <p className="text-sm text-gray-400">{relation.relationType}</p>
                  <p className="font-semibold">
                    {relation.node.title.english || relation.node.title.romaji}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations Section */}
        {anime.recommendations.nodes.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Recommendations</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {anime.recommendations.nodes.map((rec, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => navigate(`/anime/${rec.mediaRecommendation.id}`)}
                >
                  <p className="font-semibold">
                    {rec.mediaRecommendation.title.english || rec.mediaRecommendation.title.romaji}
                  </p>
                  <p className="text-sm text-gray-400">Score: {rec.mediaRecommendation.averageScore}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeTVDetail;
