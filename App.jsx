
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { db } from "./firebase";
import {
  ref,
  set,
  get,
  update,
  onValue
} from "firebase/database";

function App() {
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState("regular");
  const [availableTeams, setAvailableTeams] = useState([]);
  const [draftedTeams, setDraftedTeams] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [draftOrder, setDraftOrder] = useState([]);
  const [loading, setLoading] = useState(true);

  const picksPerTeam = eventType === "major" ? 5 : 3;

  useEffect(() => {
    const loadFromConfigAndFirebase = async () => {
      try {
        const res = await fetch("/tournament_config.json");
        const config = await res.json();
        setEventName(config.eventName);
        setDraftOrder(config.draftOrder);
        setEventType(config.type || "regular");

        const snapshot = await get(ref(db));
        const data = snapshot.val() || {};
        if (!data.availableTeams || data.availableTeams.length === 0) {
          await set(ref(db), {
            availableTeams: config.teams,
            draftedTeams: [],
            currentPickIndex: 0
          });
        }
      } catch (err) {
        console.error("Error loading config or Firebase:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFromConfigAndFirebase();

    const unsub = onValue(ref(db), (snapshot) => {
      const data = snapshot.val() || {};
      setAvailableTeams(data.availableTeams || []);
      setDraftedTeams(data.draftedTeams || []);
      setCurrentPickIndex(data.currentPickIndex || 0);
    });

    return () => unsub();
  }, []);

  const getCurrentPicker = () => {
    const round = Math.floor(currentPickIndex / draftOrder.length);
    const position = currentPickIndex % draftOrder.length;
    return round % 2 === 0
      ? draftOrder[position]
      : draftOrder[draftOrder.length - 1 - position];
  };

  const handleDraft = (teamObj) => {
    if (!teamObj || currentPickIndex >= draftOrder.length * picksPerTeam) return;

    const newDraft = {
      pick: currentPickIndex + 1,
      team: teamObj.team,
      odds: teamObj.odds,
      drafter: getCurrentPicker()
    };

    const updatedDrafted = [...draftedTeams, newDraft];
    const updatedAvailable = availableTeams.filter((t) => t.team !== teamObj.team);

    const updates = {
      draftedTeams: updatedDrafted,
      availableTeams: updatedAvailable,
      currentPickIndex: currentPickIndex + 1
    };

    update(ref(db), updates);
  };

  const resetDraft = async () => {
    try {
      const res = await fetch("/tournament_config.json");
      const config = await res.json();
      setEventName(config.eventName);
      setDraftOrder(config.draftOrder);
      setEventType(config.type || "regular");
      await set(ref(db), {
        availableTeams: config.teams,
        draftedTeams: [],
        currentPickIndex: 0
      });
    } catch (err) {
      console.error("Failed to reset draft:", err);
    }
  };

  if (loading) return <div>Loading...</div>;

  const draftComplete = currentPickIndex >= draftOrder.length * picksPerTeam;

  return (
    <div className="app">
      <h1>HFH Draft: {eventName}</h1>
      <button onClick={resetDraft}>🔁 Reset Draft</button>
      <h2>Available Teams</h2>
      <div className="current-picker">
        {draftComplete
          ? "✅ Draft Complete"
          : <>⛳️ On the clock: <span>{getCurrentPicker()}</span></>}
      </div>
      <div className="team-list">
        {availableTeams.map((teamObj, idx) => (
          <button
            key={idx}
            className="team-button"
            onClick={() => handleDraft(teamObj)}
            disabled={draftComplete}
          >
            {teamObj.team} <span style={{ fontSize: "0.8em" }}>+{teamObj.odds}</span>
          </button>
        ))}
      </div>
      <h2>Draft Board</h2>
      <div className="draft-board">
        {draftedTeams.map((entry, idx) => (
          <div key={idx} className="drafted-team">
            {entry.pick}. {entry.drafter} → {entry.team}{" "}
            <span style={{ fontSize: "0.8em" }}>+{entry.odds}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
