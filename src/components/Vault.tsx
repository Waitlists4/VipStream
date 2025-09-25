import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Film, Search, Trash2, Play, Calendar, Star, ArrowLeft, Heart, Archive, TrendingUp, Users, BarChart3, Clock, Target, Award, Tv } from 'lucide-react';
import { watchlistService, WatchlistMovie, WatchlistTVShow } from '../services/watchlist';
import { tmdb } from '../services/tmdb';
import GlobalNavbar from './GlobalNavbar';

import { languages, translations } from '../data/i18n'

import { useLanguage } from "./LanguageContext"

type CombinedItem =
  | { type: 'movie'; data: WatchlistMovie; lastActivity: number }
  | { type: 'tv'; data: WatchlistTVShow; lastActivity: number };

const Vault: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'watchlist' | 'stats' | 'favorites'>('watchlist');
  const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [favoriteMovies, setFavoriteMovies] = useState<any[]>([]);
  const [favoriteShows, setFavoriteShows] = useState<any[]>([]);
  const [sortOption, setSortOption] = useState<'date' | 'title' | 'rating'>('date');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const { language, setLanguage } = useLanguage()
  const t = translations[language] || translations.en

  const loadData = () => {
    setLoading(true);
    const items = watchlistService.getCombinedWatchlist();
    setCombinedItems(items);
    
    // Load favorites
    const storedMovies = JSON.parse(localStorage.getItem('favoriteMovies') || '[]');
    const storedShows = JSON.parse(localStorage.getItem('favoriteShows') || '[]');

    // Add lastActivity timestamp if missing
    const now = Date.now();
    const favoritesWithLastActivityMovies = storedMovies.map(movie => ({
      ...movie,
      lastActivity: movie.lastActivity ?? now,
    }));
    const favoritesWithLastActivityShows = storedShows.map(show => ({
      ...show,
      lastActivity: show.lastActivity ?? now,
    }));

    setFavoriteMovies(favoritesWithLastActivityMovies);
    setFavoriteShows(favoritesWithLastActivityShows);
    
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    
    // Auto-import from recently viewed on first load
    const hasImported = localStorage.getItem('lunastream-watchlist-imported');
    if (!hasImported) {
      watchlistService.importFromRecentlyViewed();
      localStorage.setItem('lunastream-watchlist-imported', 'true');
      loadData(); // Reload after import
    }
  }, []);

  const clearWatchlist = () => {
    if (confirm('Are you sure you want to clear your entire watchlist?')) {
      watchlistService.clearWatchlist();
      setCombinedItems([]);
    }
  };

  const clearFavorites = () => {
    if (confirm('Are you sure you want to clear all favorites?')) {
      localStorage.removeItem('favoriteMovies');
      localStorage.removeItem('favoriteShows');
      setFavoriteMovies([]);
      setFavoriteShows([]);
    }
  };

  const removeItem = (item: CombinedItem) => {
    if (item.type === 'movie') {
      watchlistService.removeMovieFromWatchlist(item.data.id);
    } else {
      watchlistService.removeShowFromWatchlist(item.data.id);
    }
    loadData();
  };

  const removeFavorite = (id: number, type: 'movie' | 'tv') => {
    if (type === 'movie') {
      const updated = favoriteMovies.filter(movie => movie.id !== id);
      localStorage.setItem('favoriteMovies', JSON.stringify(updated));
      setFavoriteMovies(updated);
    } else {
      const updated = favoriteShows.filter(show => show.id !== id);
      localStorage.setItem('favoriteShows', JSON.stringify(updated));
      setFavoriteShows(updated);
    }
  };

  const filteredItems = useMemo(() => {
    let items = combinedItems;

    // Category filter
    if (categoryFilter) {
      items = items.filter(item => {
        if (categoryFilter === 'Movie') return item.type === 'movie';
        if (categoryFilter === 'TV Show') return item.type === 'tv';
        return true;
      });
    }

    // Search filter
    if (searchTerm !== '') {
      items = items.filter((item) => {
        if (item.type === 'movie') {
          return (item.data as WatchlistMovie).title.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (item.type === 'tv') {
          return (item.data as WatchlistTVShow).name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        return false;
      });
    }

    return items;
  }, [searchTerm, combinedItems, categoryFilter]);

  const filteredFavorites = useMemo(() => {
    // Combine favorites
    let items = [...favoriteMovies, ...favoriteShows];

    // Filter by category if selected
    if (categoryFilter) {
      if (categoryFilter === 'Movie' || 'Film') {
        items = favoriteMovies; // Only movies
      } else if (categoryFilter === 'TV Show' || 'TV-serie') {
        items = favoriteShows; // Only shows
      }
    }

    if (searchTerm !== '') {
      items = items.filter((item) => {
        const title = item.title || item.name || '';
        return title.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    return items;
  }, [searchTerm, favoriteMovies, favoriteShows, categoryFilter]);

  const stats = {
    totalWatched: combinedItems.length,
    totalFavorites: favoriteMovies.length + favoriteShows.length,
    moviesWatched: combinedItems.filter(item => item.type === 'movie').length,
    showsWatched: combinedItems.filter(item => item.type === 'tv').length,
    favoriteMovies: favoriteMovies.length,
    favoriteShows: favoriteShows.length,
  };

  const tabs = [
            { id: 'watchlist', label: t.vault_watchlist, icon: Play, count: combinedItems.length },
        { id: 'favorites', label: t.vault_favorites, icon: Heart, count: stats.totalFavorites },
        { id: 'stats', label: t.vault_statistics, icon: BarChart3, count: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <GlobalNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {t.vault_my_content} {t.nav_vault}
                </span>
              </h1>
              <p className="text-gray-600 dark:text-gray-200">
                {t.vault_tagline}
              </p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <select
                  id="category"
                  value={categoryFilter || ''}
                  onChange={(e) => setCategoryFilter(e.target.value || null)}
                  className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl border border-pink-200/50 dark:border-gray-600/30 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200 appearance-none"
                >
                  <option value="">{t.filter_all}</option>
                  <option value="Movie">{t.movies}</option>
                  <option value="TV Show">{t.content_tv_plural}</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={`${t.vault_search_placeholder}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl border border-pink-200/50 dark:border-gray-600/30 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200/50 dark:border-gray-600/30 p-2 transition-colors duration-300">
            <div className="flex space-x-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {tab.count !== null && (
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        activeTab === tab.id
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-spin flex items-center justify-center shadow-lg">
              <Archive className="w-6 h-6 text-white" />
            </div>
          </div>
        )}

        {/* Tab Content */}
        {!loading && (
          <>
            {/* Watchlist Tab */}
            {activeTab === 'watchlist' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {t.vault_recently_watched} ({filteredItems.length})
                  </h2>
                  {combinedItems.length > 0 && (
                    <button
                      onClick={clearWatchlist}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.vault_clear_all_watchlist}</span>
                    </button>
                  )}
                </div>

                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
                      <Play className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {searchTerm ? t.vault_no_results_found : t.vault_watchlist_empty}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-200 mb-6 text-center max-w-md">
                      {searchTerm 
                        ? `${t.vault_no_watchlist_match} "${searchTerm}".`
                        : t.vault_start_adding_watchlist
                      }
                    </p>
                    {!searchTerm && (
                      <Link
                        to="/"
                        className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t.vault_browse_content}</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredItems.map((item, idx) => {
                      const isMovie = item.type === 'movie';
                      const data = item.data;
                      const title = isMovie ? (data as WatchlistMovie).title : (data as WatchlistTVShow).name;
                      const releaseDate = isMovie ? (data as WatchlistMovie).release_date : (data as WatchlistTVShow).first_air_date;
                      const link = isMovie ? `/movie/${data.id}` : `/tv/${data.id}`;

                      return (
                        <div
                          key={`${item.type}-${data.id}-${idx}`}
                          className="group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-lg border border-pink-200/50 dark:border-gray-600/30 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                        >
                          <Link to={link} className="block">
                            <div className="aspect-[2/3] overflow-hidden">
                              <img
                                src={tmdb.getImageUrl(data.poster_path, 'w342')}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            </div>
                            
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                {title}
                              </h3>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{releaseDate ? new Date(releaseDate).getFullYear() : t.content_n_a}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  <span>{data.vote_average.toFixed(1)}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {isMovie ? t.content_movie_singular : t.content_tv_singular}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Play className="w-3 h-3 text-pink-500" />
                                  <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">{t.action_watch}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              removeItem(item);
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                            title={t.action_remove_from_watchlist || "Remove from watchlist"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {t.vault_favorites} ({filteredFavorites.length})
                  </h2>
                  {(favoriteMovies.length > 0 || favoriteShows.length > 0) && (
                    <button
                      onClick={clearFavorites}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.vault_clear_all_favorites}</span>
                    </button>
                  )}
                </div>

                {filteredFavorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
                      <Heart className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {searchTerm ? t.vault_no_results_found : t.vault_no_favorites_yet}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-200 mb-6 text-center max-w-md">
                      {searchTerm 
                        ? `${t.vault_no_favorites_match} "${searchTerm}".`
                        : t.vault_start_adding_favorites
                      }
                    </p>
                    {!searchTerm && (
                      <Link
                        to="/"
                        className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t.vault_browse_content}</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {filteredFavorites.map((item, idx) => {
                      const isMovie = 'title' in item;
                      const title = isMovie ? item.title : item.name;
                      const releaseDate = isMovie ? item.release_date : item.first_air_date;
                      const link = isMovie ? `/movie/${item.id}` : `/tv/${item.id}`;

                      return (
                        <div
                          key={`fav-${isMovie ? 'movie' : 'tv'}-${item.id}-${idx}`}
                          className="group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-lg border border-pink-200/50 dark:border-gray-600/30 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                        >
                          <Link to={link} className="block">
                            <div className="aspect-[2/3] overflow-hidden">
                              <img
                                src={tmdb.getImageUrl(item.poster_path, 'w342')}
                                alt={title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                              />
                            </div>
                            
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                {title}
                              </h3>
                              
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{releaseDate ? new Date(releaseDate).getFullYear() : t.content_n_a}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  <span>{item.vote_average?.toFixed(1) || t.content_n_a}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  {isMovie ? t.content_movie_singular : t.content_tv_singular}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <Heart className="w-3 h-3 text-pink-500 fill-current" />
                                  <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">{t.vault_favorite}</span>
                                </div>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              removeFavorite(item.id, isMovie ? 'movie' : 'tv');
                            }}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                            title={t.action_remove_from_favorites || "Remove from favorites"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {t.vault_statistics_title}
                </h2>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200/50 dark:border-gray-600/30 p-6 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.vault_total} {t.vault_watched}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalWatched}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                        <Play className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-purple-200/50 dark:border-gray-600/30 p-6 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.vault_total} {t.vault_favorites}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalFavorites}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-200/50 dark:border-gray-600/30 p-6 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.movies} {t.watched}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.moviesWatched}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                        <Film className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-green-200/50 dark:border-gray-600/30 p-6 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t.tvs} {t.watched}</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.showsWatched}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Tv className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-pink-200/50 dark:border-gray-600/30 p-6 transition-colors duration-300">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2 text-pink-500" />
                      {t.vault_content_breakdown}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">{t.movies}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full"
                              style={{ width: `${stats.totalWatched > 0 ? (stats.moviesWatched / stats.totalWatched) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100 w-8">{stats.moviesWatched}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">{t.tvs}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                              style={{ width: `${stats.totalWatched > 0 ? (stats.showsWatched / stats.totalWatched) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100 w-8">{stats.showsWatched}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-purple-200/50 dark:border-gray-600/30 p-6 transition-colors duration-300">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <Heart className="w-5 h-5 mr-2 text-purple-500" />
                      {t.vault_favorites}{t.vault_breakdown}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">{t.favorite} {t.movies}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full"
                              style={{ width: `${stats.totalFavorites > 0 ? (stats.favoriteMovies / stats.totalFavorites) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100 w-8">{stats.favoriteMovies}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-300">{t.favorite} {t.tvs}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                              style={{ width: `${stats.totalFavorites > 0 ? (stats.favoriteShows / stats.totalFavorites) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100 w-8">{stats.favoriteShows}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">{t.keep_building}</h3>
                  <p className="text-lg opacity-90 mb-6">
                    {t.keep_building_sub}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      to="/"
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition-all text-white font-semibold"
                    >
                      <TrendingUp className="w-5 h-5" />
                      {t.vault_browse_trending}
                    </Link>
                    <Link
                      to="/search"
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 transition-all text-white font-semibold"
                    >
                      <Search className="w-5 h-5" />
                      {t.search_content}
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Vault;
