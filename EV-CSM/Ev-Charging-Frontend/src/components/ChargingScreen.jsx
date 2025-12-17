import React, { useState, useEffect, useMemo } from "react";
import { MapPin, Clock } from "lucide-react";
import "../App.css";

const ChargingScreen = ({ station, userData, setScreen, setSessionData }) => {
  const [isCharging, setIsCharging] = useState(false);

  // FRONTEND default values BEFORE START
  const [elapsedTime, setElapsedTime] = useState(0);      // sec
  const [energyConsumed, setEnergyConsumed] = useState(0); // kWh
  const [currentPower, setCurrentPower] = useState(0);     // kW

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ---------------- FETCH LIVE DATA ONLY WHEN CHARGING ----------------
  const fetchStationData = async () => {
    if (!isCharging) return; // STOP API calls before start

    try {
      const res = await fetch("https://evcsms-v2-0.onrender.com/stations");
      const data = await res.json();
      const live = data.find((s) => s._id === station._id);

      if (!live) return;

      // Fetch ONLY WHILE CHARGING
      setCurrentPower(live.currPower ?? 0);
      setEnergyConsumed((live.consPower ?? 0) / 1000); // Wh → kWh
      setElapsedTime(live.duration ?? 0);
    } catch (err) {
      console.error("API Fetch Error:", err);
    }
  };

  // Fetch every 2 seconds ONLY WHEN CHARGING
  useEffect(() => {
    if (!isCharging) return;

    fetchStationData(); // immediate call

    const interval = setInterval(fetchStationData, 2000);
    return () => clearInterval(interval);
  }, [isCharging]);

  // ---------------- RESTORE ACTIVE SESSION ON REFRESH ----------------
  useEffect(() => {
    const saved = localStorage.getItem("activeCharging");
    if (!saved) return;

    const session = JSON.parse(saved);

    if (session.stationId === station._id && session.userId === userData._id) {
      setIsCharging(true);
    }
  }, []);

  // ---------------- FORMAT TIME ----------------
  const formattedTime = useMemo(() => {
    const m = Math.floor(elapsedTime / 60);
    const s = elapsedTime % 60;
    return `${m < 10 ? "0" : ""}${m}m ${s < 10 ? "0" : ""}${s}s`;
  }, [elapsedTime]);

  // ---------------- COST ----------------
  const totalCost = parseFloat((energyConsumed * station.rate).toFixed(2));

  // ---------------- START / STOP CHARGING ----------------
  const handleStartStop = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      // -------- STOP CHARGING ----------
      if (isCharging) {
        localStorage.removeItem("activeCharging");

        setSessionData({
          station: station.name,
          energy: energyConsumed,
          cost: totalCost,
          timestamp: new Date().toISOString(),
        });

        setIsCharging(false);

        // Reset values to 0 after stop
        setEnergyConsumed(0);
        setElapsedTime(0);
        setCurrentPower(0);

        setScreen("payment_due");
        return;
      }

      // -------- START CHARGING ----------
      localStorage.setItem(
        "activeCharging",
        JSON.stringify({
          stationId: station._id,
          userId: userData._id,
          startTime: Date.now(),
        })
      );

      // Reset values to 0 immediately when starting
      setEnergyConsumed(0);
      setElapsedTime(0);
      setCurrentPower(0);

      setIsCharging(true);
    } catch (err) {
      setErrorMsg("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="charging-view">
      <div className="charging-header">
        <h2 className="charging-title">{station.name}</h2>
        <div className="status-tag">
          {currentPower} kW
        </div>
      </div>

      <p style={{ color: "var(--color-text-medium)", marginBottom: 24 }}>
        <MapPin size={12} /> {station.address || "N/A"}
      </p>

      {/* ---------------- STATION DATA ---------------- */}
      <div className="charging-stats-grid card">
        <div className="stat-item">
          <div className="stat-value">{station.maxCapacity} kW</div>
          <div className="stat-label">Max Capacity</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">₹{station.rate}/kWh</div>
          <div className="stat-label">Rate</div>
        </div>

        <div className="stat-item">
          <div className="stat-value">{userData.vehicleNo}</div>
          <div className="stat-label">Vehicle No.</div>
        </div>
      </div>

      {/* ---------------- LIVE POWER & ENERGY ---------------- */}
      <div className="gauge-grid">
        <div className="gauge-card card">
          <p className="gauge-value">{station.currPower}</p>
          <p className="gauge-unit">kW</p>
          <p className="gauge-label">Current Power</p>
        </div>

        <div className="gauge-card card">
          <p className="gauge-value">{energyConsumed.toFixed(3)}</p>
          <p className="gauge-unit">kWh</p>
          <p className="gauge-label">Consumed Energy</p>
        </div>
      </div>

      {/* ---------------- SESSION INFO ---------------- */}
      <div className="card" style={{ padding: 20 }}>
        <div className="session-details">
          <span>
            <Clock size={16} /> Duration:{" "}
            <span className="duration-text">{formattedTime}</span>
          </span>

          <span className="amount-text">₹{totalCost}</span>
        </div>
      </div>

      {/* ---------------- START / STOP BUTTON ---------------- */}
      <div
        className="button-group"
        style={{ justifyContent: "center" }}
      >
        <button
          className="button-primary"
          onClick={handleStartStop}
          disabled={loading}
          style={{
            width: "100%",
            maxWidth: 350,
            backgroundColor: isCharging
              ? "var(--color-not-available)"
              : "var(--color-primary-green)",
          }}
        >
          {loading
            ? "Please Wait..."
            : isCharging
            ? "Stop & Pay"
            : "Start Charging"}
        </button>
      </div>

      {errorMsg && (
        <p style={{ color: "red", marginTop: 10, textAlign: "center" }}>
          {errorMsg}
        </p>
      )}
    </div>
  );
};

export default ChargingScreen;
