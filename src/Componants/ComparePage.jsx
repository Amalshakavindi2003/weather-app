import { useEffect, useState } from 'react'
import axiosInstance from './axiosInstance'
import Endpoints from './EndPoints'

const API_KEY = import.meta.env.VITE_API_KEY ?? import.meta.env.API_KEY

function formatTemperature(value) {
  return `${Math.round(value)}°C`
}

function formatWind(value) {
  return `${value.toFixed(1)} m/s`
}

function getMetricClass(firstValue, secondValue, isFirstCity, higherIsBetter) {
  if (firstValue === null || secondValue === null) {
    return 'neutral'
  }

  if (firstValue === secondValue) {
    return 'neutral'
  }

  const firstCityIsBetter = higherIsBetter ? firstValue > secondValue : firstValue < secondValue
  const currentCityIsBetter = isFirstCity ? firstCityIsBetter : !firstCityIsBetter

  return currentCityIsBetter ? 'better' : 'worse'
}

function ComparePage() {
  const [leftInput, setLeftInput] = useState('')
  const [rightInput, setRightInput] = useState('')
  const [leftQuery, setLeftQuery] = useState('')
  const [rightQuery, setRightQuery] = useState('')
  const [leftRequestId, setLeftRequestId] = useState(0)
  const [rightRequestId, setRightRequestId] = useState(0)
  const [leftData, setLeftData] = useState(null)
  const [rightData, setRightData] = useState(null)
  const [leftLoading, setLeftLoading] = useState(false)
  const [rightLoading, setRightLoading] = useState(false)
  const [leftError, setLeftError] = useState('')
  const [rightError, setRightError] = useState('')

  useEffect(() => {
    if (!leftRequestId) {
      return
    }

    if (!leftQuery) {
      setLeftData(null)
      setLeftError('')
      setLeftLoading(false)
      return
    }

    let cancelled = false

    const loadLeftCity = async () => {
      try {
        setLeftLoading(true)
        setLeftError('')
        setLeftData(null)

        if (!API_KEY) {
          throw new Error('API key is missing')
        }

        const response = await axiosInstance.get(
          `${Endpoints.weather}?q=${encodeURIComponent(leftQuery)}&appid=${API_KEY}&units=metric`,
        )

        if (!cancelled) {
          setLeftData(response.data)
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unable to load weather data'
          setLeftData(null)
          setLeftError(message)
        }
      } finally {
        if (!cancelled) {
          setLeftLoading(false)
        }
      }
    }

    loadLeftCity()

    return () => {
      cancelled = true
    }
  }, [leftQuery, leftRequestId])

  useEffect(() => {
    if (!rightRequestId) {
      return
    }

    if (!rightQuery) {
      setRightData(null)
      setRightError('')
      setRightLoading(false)
      return
    }

    let cancelled = false

    const loadRightCity = async () => {
      try {
        setRightLoading(true)
        setRightError('')
        setRightData(null)

        if (!API_KEY) {
          throw new Error('API key is missing')
        }

        const response = await axiosInstance.get(
          `${Endpoints.weather}?q=${encodeURIComponent(rightQuery)}&appid=${API_KEY}&units=metric`,
        )

        if (!cancelled) {
          setRightData(response.data)
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Unable to load weather data'
          setRightData(null)
          setRightError(message)
        }
      } finally {
        if (!cancelled) {
          setRightLoading(false)
        }
      }
    }

    loadRightCity()

    return () => {
      cancelled = true
    }
  }, [rightQuery, rightRequestId])

  const handleLeftSubmit = (event) => {
    event.preventDefault()
    setLeftQuery(leftInput.trim())
    setLeftRequestId((currentId) => currentId + 1)
  }

  const handleRightSubmit = (event) => {
    event.preventDefault()
    setRightQuery(rightInput.trim())
    setRightRequestId((currentId) => currentId + 1)
  }

  const leftTemperature = leftData?.main?.temp ?? null
  const rightTemperature = rightData?.main?.temp ?? null
  const leftHumidity = leftData?.main?.humidity ?? null
  const rightHumidity = rightData?.main?.humidity ?? null
  const leftWind = leftData?.wind?.speed ?? null
  const rightWind = rightData?.wind?.speed ?? null

  const renderValue = (value, className) => {
    if (value === null || value === undefined) {
      return <span className={`metricValue ${className}`}>-</span>
    }

    return <span className={`metricValue ${className}`}>{value}</span>
  }

  const renderCityCard = (data, loading, error, isFirstCity) => {
    const cityName = data?.name ?? (isFirstCity ? 'City 1' : 'City 2')
    const temperatureClass = getMetricClass(leftTemperature, rightTemperature, isFirstCity, true)
    const humidityClass = getMetricClass(leftHumidity, rightHumidity, isFirstCity, false)
    const windClass = getMetricClass(leftWind, rightWind, isFirstCity, false)

    return (
      <article className="cityCard">
        {loading ? (
          <p className="cardState">Loading weather...</p>
        ) : error ? (
          <p className="cardState errorState">{error}</p>
        ) : data ? (
          <>
            <div className="cityHeader">
              <div>
                <p className="cityLabel">{isFirstCity ? 'First city' : 'Second city'}</p>
                <h3>{cityName}</h3>
              </div>
              <img
                className="weatherIcon"
                src={`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`}
                alt={data.weather[0].main}
              />
            </div>

            <p className="conditionText">{data.weather[0].main}</p>

            <div className="metricList">
              <div className="metricItem">
                <span>Temperature</span>
                {renderValue(formatTemperature(data.main.temp), temperatureClass)}
              </div>
              <div className="metricItem">
                <span>Humidity</span>
                {renderValue(`${data.main.humidity}%`, humidityClass)}
              </div>
              <div className="metricItem">
                <span>Wind speed</span>
                {renderValue(formatWind(data.wind.speed), windClass)}
              </div>
              <div className="metricItem">
                <span>Condition</span>
                <span className="metricValue neutral">{data.weather[0].main}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="cardState">Search a city to view its weather.</p>
        )}
      </article>
    )
  }

  return (
    <div className="comparePage">
      <div className="pageHeader">
        <h1 className="title">Compare Cities</h1>
        <p className="pageSubtitle">Search two cities and compare the weather side by side.</p>
      </div>

      <div className="compareInputs">
        <form className="compareInputCard" onSubmit={handleLeftSubmit}>
          <label htmlFor="left-city">First city</label>
          <div className="searchBox compareSearchBox">
            <input
              id="left-city"
              type="text"
              placeholder="Enter first city"
              value={leftInput}
              onChange={(event) => setLeftInput(event.target.value)}
            />
            <button type="submit">Search</button>
          </div>
        </form>

        <form className="compareInputCard" onSubmit={handleRightSubmit}>
          <label htmlFor="right-city">Second city</label>
          <div className="searchBox compareSearchBox">
            <input
              id="right-city"
              type="text"
              placeholder="Enter second city"
              value={rightInput}
              onChange={(event) => setRightInput(event.target.value)}
            />
            <button type="submit">Search</button>
          </div>
        </form>
      </div>

      <div className="compareGrid">
        {renderCityCard(leftData, leftLoading, leftError, true)}
        {renderCityCard(rightData, rightLoading, rightError, false)}
      </div>
    </div>
  )
}

export default ComparePage