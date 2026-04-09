import axios from "axios";
import React, { useEffect, useState } from "react";
import axiosInstance from "./axiosInstance";
import Endpoints from "./EndPoints";
const API_KEY = import.meta.env.VITE_API_KEY;
const Weather = () => {
  const [city, setCity] = useState("");
  const [data, setData] = useState(null);
  const [forecast, setForecast] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, seterror] = useState(false);
  const api = async () => {
    if (!city) return;

    try {
      setLoading(true);
      let res = await axiosInstance.get(
        `${Endpoints.weather}?q=${city}&appid=${API_KEY}&units=metric`,
      );
      // Forecast
      const res2 = await axiosInstance.get(
        `${Endpoints.forecast}?q=${city}&appid=${API_KEY}&units=metric`,
      );
      setForecast(res2.data);
      setData(res.data);
      seterror(false)
    } catch (err) {
      // alert("City not found");
      seterror(true);
      setData(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="container">
        <h1 className="title">Weather App</h1>
        <div className="searchBox">
          <input
            type="text"
            placeholder="Search city..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <button onClick={api}>Search</button>
        </div>
        {loading && <p className="loading">Loading...</p>}

        {error && <p className="loading">City Not Found</p>}
        {data && (
          <div className="mainCard">
            <h2>{data.name}</h2>
            <h1>{data.main.temp}°C</h1>
            <p>{data.weather[0].main}</p>
            <p>Wind {data.wind.speed} m/s</p>
          </div>
        )}
        {/* //Hourly */}
        <div className="hourlyWrapper">
          <div className="hourly">
            {forecast?.list?.slice(0, 6).map((item, i) => (
              <div key={i} className="hourBox">
                <p>
                  {new Date(item.dt_txt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <h3>{item.main.temp}°C</h3>
              </div>
            ))}
          </div>
        </div>
        {/* Daily */}
        <div className="daily">
          {forecast?.list
            ?.filter((_, i) => i % 8 === 0)
            .map((item, i) => {
              const weather = item.weather[0].main;

              return (
                <div key={i} className="dayCard">
                  <p>{item.dt_txt.split(" ")[0]}</p>

                  <img
                    src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`}
                    alt="weather"
                  />
                  <p>{weather}</p>
                  <h3>{item.main.temp}°C</h3>
                </div>
              );
            })}
        </div>
      </div>
    </>
  );
};

export default Weather;
