import React, { useState } from 'react';
import { anilist } from '../services/anilist';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import Loading from './Loading';

interface Anime {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  format: string;
  coverImage?: {
    large: string;
  };
  averageScore?: number;
  episodes?: number;
  status?: string;
}

const AnimeSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await anilist.searchAnime(query);
      setSearchResults(data.data.Page.media || []);
    } catch (err) {
      setError('Failed to search anime');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 
                    dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Heading */}
        <h1 className="text-4xl font-bold text-center mb-10 text-gray-900 dark:text-white">
          Search Anime
        </h1>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="mb-12">
          <div className="flex justify-center">
            <div className="relative w-full max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for anime..."
                className="w-full pl-12 pr-4 py-3 bg-white/80 dark:bg-gray-800/80 
                           border border-purple-200/50 dark:border-gray-700/50 rounded-xl 
                           text-gray-900 dark:text-white placeholder-gray-500 
                           focus:outline-none focus:ring-2 focus:ring-purple-400 
                           backdrop-blur-sm shadow-sm"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-pink-500 to-purple-500 
                           hover:from-pink-600 hover:to-purple-600 text-white p-2 rounded-lg 
                           shadow-md transition"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>

        {loading && <Loading />}

        {error && (
          <div className="text-red-500 text-center mb-4">{error}</div>
        )}

        {/* Results grid */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {searchResults.map((anime) => (
              <div
                key={anime.id}
                onClick={() => navigate(`/anime/tv/${anime.id}`)}
                className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg
                           border border-purple-200/50 dark:border-gray-700/50 overflow-hidden 
                           hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-[2/3] overflow-hidden">
                  <img
                    src={anime.coverImage?.large || '/placeholder.svg'}
                    alt={anime.title.english || anime.title.romaji}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2 
                                 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {anime.title.english || anime.title.romaji}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {anime.format} • {anime.episodes || 'N/A'} eps
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-yellow-500 mr-1">★</span>
                    {anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {searchResults.length === 0 && !loading && !error && searchQuery && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>No anime found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeSearch;
