import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, TrendingUp, Film, Star, Calendar, ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { anilist, Anime } from '../services/anilist';
import GlobalNavbar from './GlobalNavbar';
import { useLanguage } from './LanguageContext';
import { translations } from '../data/i18n';
import { useIsMobile } from '../hooks/useIsMobile';
import Loading from './Loading';

const ITEMS_PER_PAGE = 18;

const AnimeSection: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<Anime[]>([]);
  const [popularAnime, setPopularAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);

  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations[language] || translations.en;
  const isMobile = useIsMobile();

  // Debounced search effect
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const trimmedSearchInput = searchInput.trim();
      const newParams = new URLSearchParams();
      if (trimmedSearchInput) {
        newParams.set('q', trimmedSearchInput);
      }
      setSearchParams(newParams);
      setQuery(trimmedSearchInput);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchInput, setSearchParams]);

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [trendingData, popularData] = await Promise.all([
          anilist.getTrendingAnime(1, 12),
          anilist.getPopularAnime(1, 12)
        ]);
        
        setTrendingAnime(trendingData.data.Page.media || []);
        setPopularAnime(popularData.data.Page.media || []);
      } catch (err) {
        console.error('Failed to fetch anime data:', err);
        setError('Failed to load anime data');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Search functionality
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSuggestions([]);
      setHasSearched(false);
      setCurrentPage(1);
      return;
    }

    const performSearch = async () => {
      try {
        setSearchLoading(true);
        setError(null);
        
        const searchData = await anilist.searchAnime(query, 1, 50);
        setSearchResults(searchData.data.Page.media || []);
        setHasSearched(true);
        setCurrentPage(1);
      } catch (err) {
        console.error('Search failed:', err);
        setError('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    performSearch();
  }, [query]);

  // Live suggestions
  useEffect(() => {
    if (!searchInput.trim() || searchInput.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const suggestionsData = await anilist.searchAnime(searchInput, 1, 6);
        setSuggestions(suggestionsData.data.Page.media || []);
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
        setSuggestions([]);
      }
    };

    const timeout = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setQuery(searchInput.trim());
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (anime: Anime) => {
    setSuggestions([]);
    const path = anilist.isMovie(anime) ? `/anime/movie/${anime.id}` : `/anime/tv/${anime.id}`;
    navigate(path);
  };

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  // Pagination
  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return searchResults.slice(start, start + ITEMS_PER_PAGE);
  }, [searchResults, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const AnimeCard: React.FC<{ anime: Anime }> = ({ anime }) => {
    const displayTitle = anilist.getDisplayTitle(anime);
    const year = anilist.getYear(anime);
    const score = anilist.formatScore(anime.averageScore);
    const isMovie = anilist.isMovie(anime);
    const path = isMovie ? `/anime/movie/${anime.id}` : `/anime/tv/${anime.id}`;

    return (
      <div
        onClick={() => navigate(path)}
        className={`group block bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border border-purple-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer ${isMobile ? 'rounded-lg' : 'rounded-xl'}`}
      >
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={anime.coverImage.large || '/placeholder.svg'}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className={isMobile ? 'p-2' : 'p-4'}>
          <h3 className={`font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {displayTitle}
          </h3>
          <div className={`flex items-center justify-between mt-1 text-gray-500 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            <span>{year}</span>
            <div className="flex items-center">
              <Star className="w-3 h-3 text-yellow-500 mr-1" />
              <span>{score}</span>
            </div>
          </div>
          <div className={`mt-1 ${isMobile ? 'text-xs' : 'text-xs'}`}>
            <span className={`px-2 py-0.5 rounded-full text-white text-xs font-medium ${
              isMovie ? 'bg-pink-500' : 'bg-purple-500'
            }`}>
              {isMovie ? 'Movie' : anime.format}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const categorizeByFormat = (animes: Anime[]) => {
    const movies = animes.filter(a => anilist.isMovie(a));
    const tvShows = animes.filter(a => anilist.isTVShow(a));
    return { movies, tvShows };
  };

  const renderSection = (title: string, animes: Anime[], iconColor: string) => {
    const { movies, tvShows } = categorizeByFormat(animes);
    
    return (
      <div className="mb-12">
        <h2 className={`flex items-center mb-8 font-bold text-gray-900 dark:text-white ${isMobile ? 'text-xl' : 'text-3xl'}`}>
          <TrendingUp className={`mr-3 ${iconColor} ${isMobile ? 'w-6 h-6' : 'w-8 h-8'}`} />
          {title}
        </h2>
        
        {tvShows.length > 0 && (
          <>
            <h3 className={`font-semibold mb-4 text-gray-800 dark:text-gray-200 ${isMobile ? 'text-base' : 'text-xl'}`}>
              TV Shows & Series
            </h3>
            <div className={`grid gap-6 mb-8 ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
              {tvShows.map(anime => <AnimeCard key={anime.id} anime={anime} />)}
            </div>
          </>
        )}
        
        {movies.length > 0 && (
          <>
            <h3 className={`font-semibold mb-4 text-gray-800 dark:text-gray-200 ${isMobile ? 'text-base' : 'text-xl'}`}>
              Movies
            </h3>
            <div className={`grid gap-6 ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
              {movies.map(anime => <AnimeCard key={anime.id} anime={anime} />)}
            </div>
          </>
        )}
      </div>
    );
  };

  if (loading) {
    return <Loading message="Loading anime..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <GlobalNavbar />

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${isMobile ? 'pt-8 pb-8' : 'pt-16 pb-12'}`}>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`font-bold text-gray-900 dark:text-white mb-6 ${isMobile ? 'text-2xl' : 'text-4xl'}`}>
            <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Anime
            </span>
          </h1>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl shadow-xl border border-pink-200/50 dark:border-gray-700/50 transition-colors duration-300">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className={`text-pink-400 dark:text-purple-400 transition-colors duration-300 ${isMobile ? 'h-5 w-5' : 'h-6 w-6'}`} />
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => {}}
                  onBlur={() => setTimeout(clearSuggestions, 200)}
                  placeholder="Search for anime..."
                  className={`block w-full bg-transparent border-0 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:ring-0 focus:outline-none transition-colors duration-300 ${isMobile ? 'pl-12 pr-4 py-4 text-base' : 'pl-16 pr-6 py-6 text-lg'}`}
                />
                <button 
                  type="submit" 
                  className={`absolute inset-y-0 right-0 flex items-center ${isMobile ? 'pr-2' : 'pr-6'}`}
                >
                  <div className={`bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${isMobile ? 'px-4 py-2' : 'px-8 py-3'}`}>
                    <span className={isMobile ? 'hidden' : 'inline'}>Search</span>
                    <Search className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5 hidden'}`} />
                  </div>
                </button>
              </div>
              
              {/* Suggestions Dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute z-50 mt-2 w-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 max-h-96 overflow-auto">
                  {suggestions.map((anime) => {
                    const displayTitle = anilist.getDisplayTitle(anime);
                    const year = anilist.getYear(anime);
                    const score = anilist.formatScore(anime.averageScore);
                    const isMovie = anilist.isMovie(anime);

                    return (
                      <div
                        key={anime.id}
                        onClick={() => handleSuggestionClick(anime)}
                        className="flex items-center p-4 hover:bg-pink-50 dark:hover:bg-gray-700/50 cursor-pointer transition-all duration-200 border-b border-gray-100 dark:border-gray-700/30 last:border-b-0"
                      >
                        {/* Poster Image */}
                        <div className="flex-shrink-0 w-12 h-16 mr-4 rounded-lg overflow-hidden shadow-md">
                          <img
                            src={anime.coverImage.medium || anime.coverImage.large}
                            alt={displayTitle}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                                {displayTitle}
                              </h3>
                              <div className="flex items-center space-x-3 mt-1">
                                <span className="text-xs text-gray-500 dark:text-gray-400">{year}</span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-yellow-500 text-xs">★</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-300">{score}</span>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  isMovie
                                    ? "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                }`}>
                                  {isMovie ? 'Movie' : anime.format}
                                </span>
                              </div>

                              {/* Episodes info for TV shows */}
                              {!isMovie && anime.episodes && (
                                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{anime.episodes} episodes</span>
                                  {anime.duration && <span>{anime.duration}m per episode</span>}
                                </div>
                              )}

                              {/* Description preview */}
                              {anime.description && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                  {anime.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
                                </p>
                              )}
                            </div>

                            {/* Popularity indicator */}
                            <div className="flex-shrink-0 ml-3">
                              <div className="w-2 h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-t from-pink-500 to-purple-500 rounded-full transition-all duration-300"
                                  style={{
                                    height: `${Math.min((anime.popularity / 10000) * 100, 100)}%`,
                                    width: "100%",
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`font-bold text-gray-900 dark:text-white ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                Search Results for "<span className="text-pink-600 dark:text-pink-400">{query}</span>"
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}
              </p>
            </div>

            {searchLoading ? (
              <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-spin flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <p className="text-gray-600 dark:text-gray-300">Searching anime...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No anime found matching your search.
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
                  {paginatedResults.map(anime => <AnimeCard key={anime.id} anime={anime} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className={`flex justify-center items-center gap-4 flex-wrap ${isMobile ? 'mt-6 gap-2' : 'mt-10'}`}>
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow disabled:opacity-40 ${isMobile ? 'px-3 py-2' : 'px-4 py-2'}`}
                    >
                      <ChevronsLeft size={isMobile ? 16 : 18} />
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow disabled:opacity-40 ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-2'}`}
                    >
                      <ArrowLeft className={`inline-block mr-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} /> Prev
                    </button>

                    <span className={`font-medium text-gray-700 dark:text-gray-300 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow disabled:opacity-40 ${isMobile ? 'px-4 py-2 text-sm' : 'px-6 py-2'}`}
                    >
                      Next <ArrowRight className={`inline-block ml-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    </button>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full shadow disabled:opacity-40 ${isMobile ? 'px-3 py-2' : 'px-4 py-2'}`}
                    >
                      <ChevronsRight size={isMobile ? 16 : 18} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Trending and Popular Sections */}
        {!hasSearched && (
          <>
            {renderSection('Trending Anime', trendingAnime, 'text-pink-500')}
            {renderSection('Popular Anime', popularAnime, 'text-purple-500')}
          </>
        )}

        {error && (
          <div className="text-center text-red-500 py-8">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeSection;