import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp } from 'lucide-react';
import Loading from './Loading';
import GlobalNavbar from './GlobalNavbar';

interface Anime {
  id: number;
  title: { romaji: string; english: string; native: string };
  format: string;
  coverImage?: { large: string };
  averageScore?: number;
  episodes?: number;
  status?: string;
  season?: string;
  seasonYear?: number;
}

const AnimeSection: React.FC = () => {
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [popularAnime, setPopularAnime] = useState<Anime[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopAnimes = async () => {
      try {
        setLoading(true);
        const trendingQuery = `
          query {
            Page(page: 1, perPage: 12) {
              media(type: ANIME, sort: TRENDING_DESC) {
                id title { romaji english native }
                format coverImage { large }
                averageScore episodes status season seasonYear
              }
            }
          }
        `;
        const popularQuery = `
          query {
            Page(page: 1, perPage: 12) {
              media(type: ANIME, sort: POPULARITY_DESC) {
                id title { romaji english native }
                format coverImage { large }
                averageScore episodes status season seasonYear
              }
            }
          }
        `;
        const [trendingData, popularData] = await Promise.all([
          fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: trendingQuery })
          }).then(res => res.json()),
          fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: popularQuery })
          }).then(res => res.json())
        ]);
        setTrendingAnime(trendingData.data.Page.media || []);
        setPopularAnime(popularData.data.Page.media || []);
      } finally {
        setLoading(false);
      }
    };
    fetchTopAnimes();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/anime/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const categorizeByFormat = (animes: Anime[]) => {
    const movies = animes.filter(a => a.format === 'MOVIE');
    const tvShows = animes.filter(a => ['TV', 'TV_SHORT', 'OVA', 'ONA'].includes(a.format));
    return { movies, tvShows };
  };

  const AnimeCard: React.FC<{ anime: Anime }> = ({ anime }) => (
    <div
        onClick={() => navigate(`/anime/tv/${anime.id}`)}
        className="group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg 
                border border-purple-200/50 dark:border-gray-700/50 overflow-hidden 
                hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer"
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
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>{anime.episodes ? `${anime.episodes} eps` : 'N/A'}</span>
            <div className="flex items-center">
            <span className="text-yellow-500">★</span>
            <span className="ml-1">{anime.averageScore ? (anime.averageScore / 10).toFixed(1) : 'N/A'}</span>
            </div>
        </div>
        </div>
    </div>
    );


  if (loading) return <Loading />;

  const { movies: trendingMovies, tvShows: trendingTV } = categorizeByFormat(trendingAnime);
  const { movies: popularMovies, tvShows: popularTV } = categorizeByFormat(popularAnime);

  return (
    <>
        <GlobalNavbar />
        <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-center text-4xl font-bold text-gray-900 dark:text-white mb-12">
                <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Anime
                </span>
                </h1>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-12 relative">
                <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-200/50 dark:border-gray-700/50 transition-colors duration-300">
                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-pink-400 dark:text-purple-400" />
                    </div>
                    <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search for anime..."
                    className="block w-full pl-12 pr-4 py-4 bg-transparent border-0 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:ring-0 focus:outline-none"
                    />
                    <button type="submit" className="absolute inset-y-0 right-0 flex items-center pr-6">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                        Search
                    </div>
                    </button>
                </div>
                </form>

                {/* Sections */}
                {[{ title: 'Trending Anime', icon: <TrendingUp className="w-8 h-8 mr-3 text-pink-500" />, data: trendingTV, movies: trendingMovies, color: 'pink' },
                { title: 'Popular Anime', icon: <TrendingUp className="w-8 h-8 mr-3 text-purple-500" />, data: popularTV, movies: popularMovies, color: 'purple' }
                ].map((section, idx) => (
                <div key={idx} className="mb-12">
                    <h2 className="flex items-center mb-8 text-3xl font-bold text-gray-900 dark:text-white">
                    {section.icon}
                    {section.title}
                    </h2>
                    {section.data.length > 0 && (
                    <>
                        <h3 className="text-xl font-semibold mb-4">TV Shows</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
                        {section.data.map(anime => <AnimeCard key={anime.id} anime={anime} />)}
                        </div>
                    </>
                    )}
                    {section.movies.length > 0 && (
                    <>
                        <h3 className="text-xl font-semibold mb-4">Movies</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {section.movies.map(anime => <AnimeCard key={anime.id} anime={anime} />)}
                        </div>
                    </>
                    )}
                </div>
                ))}
            </div>
        </div>
    </>
  );
};

export default AnimeSection;
