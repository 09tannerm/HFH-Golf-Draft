
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import { db } from "./firebase";
import {
  ref,
  set,
  get,
  onValue,
  update,
  child
} from "firebase/database";

const draftOrder = [
  "Connor Cremers", "Connor Woods", "Tyler Chase", "Kevan Elcock", "Trevor Elcock", "Brett Smith",
  "Ryne Borden", "Jack Berry", "Tyler Ehlers", "Tanner Morris", "David Johnson", "Kyle Serrano"
];

function App() {
  const [availableTeams, setAvailableTeams] = useState([]);
  const [draftedTeams, setDraftedTeams] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dbRef = ref(db);

    onValue(dbRef, async (snapshot) => {
      const data = snapshot.val() || {};

      // Auto-populate availableTeams from allTeams if it’s empty
      if ((!data.availableTeams || data.availableTeams.length === 0) && data.allTeams) {
        const updates = {
          availableTeams: data.allTeams,
          draftedTeams: [],
          currentPickIndex: 0
        };
        await update(ref(db), updates);
        setAvailableTeams(data.allTeams);
        setDraftedTeams([]);
        setCurrentPickIndex(0);
      } else {
        setAvailableTeams(data.availableTeams || []);
        setDraftedTeams(data.draftedTeams || []);
        setCurrentPickIndex(data.currentPickIndex || 0);
      }

      setLoading(false);
    });
  }, []);

  const getCurrentPicker = () => {
    const round = Math.floor(currentPickIndex / draftOrder.length);
    const position = currentPickIndex % draftOrder.length;
    return round % 2 === 0
      ? draftOrder[position]
      : draftOrder[draftOrder.length - 1 - position];
  };

  const handleDraft = (teamObj) => {
    if (!teamObj || currentPickIndex >= draftOrder.length * 3) return;

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
    const fullTeamsSnapshot = await get(child(ref(db), "allTeams"));
    if (fullTeamsSnapshot.exists()) {
      const updates = {
        draftedTeams: [],
        availableTeams: fullTeamsSnapshot.val(),
        currentPickIndex: 0
      };
      await set(ref(db), updates);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="app">
      <h1>HFH Golf Draft</h1>
      <button onClick={resetDraft}>🔁 Reset Draft</button>
      <h2>Available Teams</h2>
      <div className="current-picker">
        {currentPickIndex < draftOrder.length * 3
          ? <>⛳️ On the clock: <span>{getCurrentPicker()}</span></>
          : "✅ Draft Complete"}
      </div>
      <div className="team-list">
        {availableTeams.map((teamObj, idx) => (
          <button
            key={idx}
            className="team-button"
            onClick={() => handleDraft(teamObj)}
            disabled={currentPickIndex >= draftOrder.length * 3}
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
        {currentPickIndex >= draftOrder.length * 3 && (
          <div className="final-results">
            <h2>Final Draft Results</h2>
            {draftOrder.map((drafter) => {
              const picks = draftedTeams.filter(e => e.drafter === drafter);
              return (
                <div key={drafter} className="drafter-summary">
                  <h3>{drafter}</h3>
                  <ul>
                    {picks.map((entry, i) => (
                      <li key={i}>{entry.team} <span style={{ fontSize: "0.8em" }}>+{entry.odds}</span></li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
