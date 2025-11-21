import React, { useState, useEffect } from 'react';
import { MapPin, Zap, Plug, BatteryCharging, Gauge } from 'lucide-react';
import { RATE_PER_KWH, BACKEND_URL } from '../data/constants';
import { RupeeIcon } from '../data/utils';
import '../App.css';

const StationSelection = ({ setScreen, setStation, userData }) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // -----------------------------
  // AUTO RESUME SESSION
  // -----------------------------
  useEffect(() => {
    const saved = localStorage.getItem("activeChargingSession");
    if (!saved) return;

    const session = JSON.parse(saved);

    if (session.userId === userData?._id) {
      fetch(`${BACKEND_URL}/stations/${session.stationId}`)
        .then(res => res.json())
        .then(station => {
          setStation(station);
          setScreen("charging");
        });
    }
  }, []);

  // -----------------------------
  // FETCH ALL STATION DATA
  // -----------------------------
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/stations`);
        if (!res.ok) throw new Error("Failed to fetch stations");

        const data = await res.json();
        setStations(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load stations.");
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  // -----------------------------
  // SELECT STATION
  // -----------------------------
  const handleUseStation = (station) => {
    setStation(station);
    setScreen('charging');
  };

  if (loading) return <p>Loading stations...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <>
      <h2 className="page-title">Available Charging Stations</h2>
      <p style={{ color: 'var(--color-text-medium)', marginBottom: '30px' }}>
        Choose a station to start charging
      </p>

      <div className="station-grid">
        {stations.map((station) => {
          const saved = localStorage.getItem("activeChargingSession");
          let isMySession = false;

          if (saved) {
            const s = JSON.parse(saved);
            if (s.stationId === station._id && s.userId === userData?._id) {
              isMySession = true;
            }
          }

          const isOccupied = station.occupancy && !isMySession;

          return (
            <div key={station._id} className="card station-card">
              <div className={`status-bar ${isOccupied ? 'status-occupied' : 'status-available'}`}>
                {isMySession ? "Resume Charging" : isOccupied ? "Occupied" : "Available"}
              </div>

              <div className="station-details">
                <h3>{station.name}</h3>

                <p>
                  <MapPin size={16} style={{ marginRight: '6px' }} />
                  {station.address || "N/A"}
                </p>

                {/* ------------  
                    SHOW ALL API DATA 
                ------------- */}
                <div className="station-info-list">
                  <div className="left-info">
                    <p><b>Max Capacity:</b> {station.maxCapacity} kWh</p>
                    <p><b>Power:</b> {station.power} kWh</p>
                  </div>

                  <div className="right-info">
                    <p><b>Highway Distance:</b> {station.disHighway} km</p>
                    <p><b>Connector:</b> {station.connector}</p>
                  </div>
                </div>


                <div className="station-features">
                  <div className="feature-item">
                    <Zap size={18} />
                    <span>{station.currPower} kWh</span>
                  </div>

                  <div className="feature-item">
                    <Plug size={18} />
                    <span>{station.connector}</span>
                  </div>

                  <div className="feature-item">
                    <RupeeIcon /> {station.rate}/kWh
                  </div>
                </div>
              </div>

              <button
                className="button-primary"
                onClick={() => handleUseStation(station)}
                disabled={isOccupied}
              >
                <BatteryCharging size={18} style={{ marginRight: '6px' }} />
                {isMySession ? 'Resume Charging' : isOccupied ? 'Station Occupied' : 'Start Charging'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default StationSelection;
