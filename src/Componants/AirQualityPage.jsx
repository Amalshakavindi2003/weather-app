import { useState } from 'react'
import axios from 'axios'
import axiosInstance from './axiosInstance'
import usePageTitle from './usePageTitle'
import { getFriendlyErrorMessage, requireApiKey } from './weatherApi'

const PAGE_TITLE = 'Weather App | Air Quality'

const AQI_LABELS = {
  1: { label: 'Good', className: 'aqiGood' },
  2: { label: 'Fair', className: 'aqiFair' },
  3: { label: 'Moderate', className: 'aqiModerate' },
  4: { label: 'Poor', className: 'aqiPoor' },
  5: { label: 'Very Poor', className: 'aqiVeryPoor' },
}

function AirQualityPage() {
  usePageTitle(PAGE_TITLE)

  const [city, setCity] = useState('')
  const [aqData, setAqData] = useState(null)
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async (event) => {
    event.preventDefault()

    const trimmedCity = city.trim()

    if (!trimmedCity) {
      setError('Please enter a city name.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setAqData(null)

      const apiKey = requireApiKey()

      const geoResponse = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
        params: {
          q: trimmedCity,
          limit: 1,
          appid: apiKey,
        },
      })

      const cityResult = geoResponse.data?.[0]

      if (!cityResult) {
        throw new Error('Unable to find that city. Please check the spelling and try again.')
      }

      const { lat, lon, name, state, country } = cityResult
      const locationDisplay = [name, state, country].filter(Boolean).join(', ')

      const airResponse = await axiosInstance.get('/air_pollution', {
        params: {
          lat,
          lon,
          appid: apiKey,
        },
      })

      const airEntry = airResponse.data?.list?.[0]

      if (!airEntry) {
        throw new Error('Air quality data is not available for this location right now.')
      }

      setLocationName(locationDisplay)
      setAqData(airEntry)
    } catch (requestError) {
      setError(getFriendlyErrorMessage(requestError, 'Unable to load air quality data right now.'))
      setAqData(null)
    } finally {
      setLoading(false)
    }
  }

  const aqiValue = aqData?.main?.aqi ?? null
  const levelInfo = aqiValue ? AQI_LABELS[aqiValue] : null
  const components = aqData?.components

  return (
    <div className="airQualityPage container">
      <h1 className="title">Air Quality</h1>
      <p className="pageSubtitle">Search any city to view AQI and key pollutants.</p>

      <form className="searchBox airQualitySearch" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search city for AQI..."
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : 'Check AQI'}
        </button>
      </form>

      {loading && <p className="loading">Loading air quality...</p>}
      {!loading && error && <p className="weatherError">{error}</p>}

      {aqData && levelInfo && (
        <section className="aqiPanel">
          <h2 className="aqLocation">{locationName}</h2>

          <div className={`aqiMeter ${levelInfo.className}`}>
            <span className="aqiValue">{aqiValue}</span>
            <span className="aqiText">{levelInfo.label}</span>
          </div>

          <div className="pollutantsGrid">
            <article className="pollutantCard">
              <h3>CO</h3>
              <p>{components.co.toFixed(2)} ug/m3</p>
            </article>
            <article className="pollutantCard">
              <h3>NO2</h3>
              <p>{components.no2.toFixed(2)} ug/m3</p>
            </article>
            <article className="pollutantCard">
              <h3>O3</h3>
              <p>{components.o3.toFixed(2)} ug/m3</p>
            </article>
            <article className="pollutantCard">
              <h3>PM2.5</h3>
              <p>{components.pm2_5.toFixed(2)} ug/m3</p>
            </article>
            <article className="pollutantCard">
              <h3>PM10</h3>
              <p>{components.pm10.toFixed(2)} ug/m3</p>
            </article>
          </div>
        </section>
      )}
    </div>
  )
}

export default AirQualityPage