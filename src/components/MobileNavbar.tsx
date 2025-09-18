import React, { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X, Home, Search, Compass, Archive, Heart, Film, Flower } from "lucide-react"
import { translations, languages } from "../data/i18n"
import { useLanguage } from "./LanguageContext"
import ThemeToggle from "./ThemeToggle"

const MobileNavbar: React.FC = () => {
  const location = useLocation()
  const { language, setLanguage } = useLanguage()
  const t = translations[language] || translations.en

  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { path: "/", label: t.nav_home, icon: Home },
    { path: "/search", label: t.nav_search, icon: Search },
    { path: "/anime", label: t.nav_anime || "Anime", icon: Flower },
    { path: "/discover", label: t.nav_discover, icon: Compass },
    { path: "/vault", label: t.nav_vault, icon: Archive },
  ]

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path)

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    setMenuOpen(false)
  }

  return (
    <nav className="md:hidden sticky top-0 z-50 bg-white dark:bg-gray-950 shadow-sm border-b border-pink-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Vertically centered by flex and minHeight */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            LunaStream
          </span>
        </Link>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-700 dark:text-white p-2"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="px-4 pb-4 space-y-3 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-pink-200/50 dark:border-gray-700/50">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(path)
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  : "text-gray-700 dark:text-white hover:bg-pink-50 dark:hover:bg-gray-800/50"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          ))}
          
          {/* Donate Link */}
          <Link
            to="/donate"
            onClick={() => setMenuOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              isActive('/donate')
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                : "text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/20"
            }`}
          >
            <Heart className="w-5 h-5" />
            <span>{t.nav_donate}</span>
          </Link>

          {/* Language Selector */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 px-1">
              {t.nav_language || 'Language'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {languages.map(({ name, shortname, flag }) => (
                <button
                  key={shortname}
                  onClick={() => handleLanguageChange(shortname)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    language === shortname
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <img 
                    src={`https://flagsapi.com/${shortname === 'en' ? 'US' : 'DK'}/flat/24.png`} 
                    alt={`${name} flag`} 
                    className="w-4 h-4 rounded-sm"
                  />
                  <span className="text-sm font-medium">{name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default MobileNavbar
