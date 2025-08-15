import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { anilist } from '../services/anilist';
import Loading from './Loading';
import { ChevronLeft, Play, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

const AnimeMovieDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<'sub' | 'dub'>('sub');
  const [selectedQuality, setSelectedQuality] = useState<'720p' | '1080p' | '4K'>('1080p');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await anilist.getAnimeDetails(parseInt(id));
        const animeData = data.data.Media;
        
        // Ensure it's a movie
        if (animeData.format !== 'MOVIE') {
          setError('This is not a movie. Redirecting to TV detail page...');
          setTimeout(() => navigate(`/anime/tv/${id}`), 2000);
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
              src={anime.bannerImage || `https://via.placeholder.com/300x450`}
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
                {formatDuration(anime.duration)}
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
                {anime.studios.nodes.map(s => s.name).join(', ')}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Status</h3>
              <p className="text-gray-300">{anime.status}</p>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {anime.description?.replace(/<[^>]*>/g, '') || 'No description available'}
              </p>
            </div>
          </div>
        </div>

        {/* Video Player Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Watch</h2>
          
          {/* Player Controls */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Player Settings</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedAudio('sub')}
                  className={`px-3 py-1 rounded ${selectedAudio === 'sub' ? 'bg-purple-600' : 'bg-gray-700'} hover:bg-purple-700 transition-colors`}
                >
                  Sub
                </button>
                <button
                  onClick={() => setSelectedAudio('dub')}
                  className={`px-3 py-1 rounded ${selectedAudio === 'dub' ? 'bg-purple-600' : 'bg-gray-700'} hover:bg-purple-700 transition-colors`}
                >
                  Dub
                </button>
              </div>
            </div>

            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
              <iframe
                src={`https://player.videasy.net/anime/${anime.id}?dub=${selectedAudio === 'dub'}`}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                title={`${anime.title.english || anime.title.romaji} - ${selectedAudio === 'sub' ? 'Subbed' : 'Dubbed'}`}
                className="w-full h-full"
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

export default AnimeMovieDetail;
