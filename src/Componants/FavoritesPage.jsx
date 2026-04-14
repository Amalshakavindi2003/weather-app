import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from './axiosInstance'
import Endpoints from './EndPoints'

const API_KEY = import.meta.env.VITE_API_KEY ?? import.meta.env.API_KEY
const FAVORITES_STORAGE_KEY = 'weatherAppFavorites'

function readFavorites() {
  try {
    const storedFavorites = localStorage.getItem(FAVORITES_STORAGE_KEY)
    const parsedFavorites = storedFavorites ? JSON.parse(storedFavorites) : []

    return Array.isArray(parsedFavorites) ? parsedFavorites : []
  } catch {
    return []
  }
}

function writeFavorites(favorites) {
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
}

function FavoritesPage() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const loadFavorites = async () => {
      const storedFavorites = readFavorites()

      setLoading(true)
      setError('')

      if (!storedFavorites.length) {
        setFavorites([])
        setLoading(false)
        return
      }

      if (!API_KEY) {
        setFavorites([])
        setError('API key is missing')
        setLoading(false)
        return
      }

      try {
        const responses = await Promise.allSettled(
          storedFavorites.map((favoriteCity) =>
            axiosInstance.get(
              `${Endpoints.weather}?q=${encodeURIComponent(favoriteCity)}&appid=${API_KEY}&units=metric`,
            ),
          ),
        )

        const nextFavorites = responses.map((response, index) => {
          const cityName = storedFavorites[index]

          if (response.status === 'fulfilled') {
            return {
              cityName: response.value.data.name,
              weather: response.value.data.weather[0].main,
              temperature: Math.round(response.value.data.main.temp),
              icon: response.value.data.weather[0].icon,
              rawName: cityName,
              status: 'ready',
            }
          }

          return {
            cityName,
            weather: 'Unavailable',
            temperature: null,
            icon: null,
            rawName: cityName,
            status: 'error',
          }
        })

        setFavorites(nextFavorites)
      } catch {
        setError('Unable to load favorites')
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [])

  const removeFavorite = (cityToRemove) => {
    const nextStoredFavorites = readFavorites().filter(
      (favoriteCity) => favoriteCity !== cityToRemove,
    )

    writeFavorites(nextStoredFavorites)
    setFavorites((currentFavorites) =>
      currentFavorites.filter((favorite) => favorite.rawName !== cityToRemove),
    )
  }

  const clearAllFavorites = () => {
    if (!favorites.length) {
      return
    }

    const confirmed = window.confirm('Remove all saved favorites?')

    if (!confirmed) {
      return
    }

    writeFavorites([])
    setFavorites([])
  }

  const handleCardClick = (cityName) => {
    navigate(`/?city=${encodeURIComponent(cityName)}`)
  }

  const handleCardKeyDown = (event, favorite) => {
    if (favorite.status !== 'ready') {
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCardClick(favorite.cityName)
    }
  }

  return (
    <div className="favoritesPage container">
      <h1 className="title">Favorites</h1>
      <p className="pageSubtitle">Saved cities load fresh weather data every time you open this page.</p>

      <div className="favoritesToolbar">
        <p className="favoritesCount">Saved cities: {favorites.length}</p>
        <button
          type="button"
          className="removeFavoriteButton secondaryButton"
          onClick={clearAllFavorites}
          disabled={loading || favorites.length === 0}
        >
          Clear All
        </button>
      </div>

      {loading && <p className="loading">Loading favorites...</p>}
      {error && <p className="loading">{error}</p>}

      {!loading && !error && favorites.length === 0 && (
        <p className="emptyState">No favorites saved yet. Add one from the Home page.</p>
      )}

      <div className="favoritesGrid">
        {favorites.map((favorite) => (
          <article
            key={favorite.rawName}
            className="favoriteCard"
            onClick={() => favorite.status === 'ready' && handleCardClick(favorite.cityName)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => handleCardKeyDown(event, favorite)}
          >
            <div className="favoriteCardHeader">
              <div>
                <h3>{favorite.cityName}</h3>
                <p>{favorite.weather}</p>
              </div>
              {favorite.status === 'ready' && favorite.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${favorite.icon}@2x.png`}
                  alt={favorite.weather}
                  className="favoriteIcon"
                />
              )}
            </div>

            <div className="favoriteCardFooter">
              <div>
                <span className="favoriteLabel">Temperature</span>
                <strong>
                  {favorite.temperature === null ? 'Unavailable' : `${favorite.temperature}°C`}
                </strong>
              </div>
              <button
                type="button"
                className="removeFavoriteButton"
                onClick={(event) => {
                  event.stopPropagation()
                  removeFavorite(favorite.rawName)
                }}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default FavoritesPage