
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

const zurichTeams = [  // shortened for clarity
  { team: "Shane Lowry / Rory McIlroy", odds: 360 },
  { team: "Kurt Kitayama / Collin Morikawa", odds: 1200 },
  { team: "Thomas Detry / Robert MacIntyre", odds: 1800 },
  { team: "J.T. Poston / Keith Mitchell", odds: 1800 }
  // Add the rest of your teams here
];

const draftOrder = [
  "Connor Cremers", "Connor Woods", "Tyler Chase", "Kevan Elcock",
  "Trevor Elcock", "Brett Smith", "Ryne Borden", "Jack Berry",
  "Tyler Ehlers", "Tanner Morris", "David Johnson", "Kyle Serrano"
];

function App() {
  const [availableTeams, setAvailableTeams] = useState(() => {
    const saved = localStorage.getItem("availableTeams");
    return saved ? JSON.parse(saved) : zurichTeams;
  });

  const [draftedTeams, setDraftedTeams] = useState(() => {
    const saved = localStorage.getItem("draftedTeams");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentPickIndex, setCurrentPickIndex] = useState(() => {
    const saved = localStorage.getItem("currentPickIndex");
    return saved ? parseInt(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem("availableTeams", JSON.stringify(availableTeams));
    localStorage.setItem("draftedTeams", JSON.stringify(draftedTeams));
    localStorage.setItem("currentPickIndex", currentPickIndex.toString());
  }, [availableTeams, draftedTeams, currentPickIndex]);

  const getCurrentPicker = () => {
    const round = Math.floor(currentPickIndex / draftOrder.length);
    const position = currentPickIndex % draftOrder.length;
    return round % 2 === 0
      ? draftOrder[position]
      : draftOrder[draftOrder.length - 1 - position];
  };

  const handleDraft = (teamObj) => {
    if (availableTeams.length === 0) return;

    const nextPickIndex = currentPickIndex + 1;

    setDraftedTeams((prev) => [
      ...prev,
      {
        pick: currentPickIndex + 1,
        team: teamObj.team,
        odds: teamObj.odds,
        drafter: getCurrentPicker()
      }
    ]);

    setAvailableTeams((prev) =>
      prev.filter((t) => t.team !== teamObj.team)
    );

    setCurrentPickIndex(nextPickIndex);
  };

  const resetDraft = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="app">
      <h1>HFH Golf Draft</h1>
      <button onClick={resetDraft}>🔁 Reset Draft</button>
      <h2>Available Teams</h2>
      <div className="current-picker">
        {currentPickIndex < draftOrder.length * 3 ? (
          <>
            ⛳️ On the clock: <span>{getCurrentPicker()}</span>
          </>
        ) : (
          "✅ Draft Complete"
        )}
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
        {currentPickIndex >= draftOrder.length * 3 && (
          <div className="final-results">
            <h2>Final Draft Results</h2>
            {draftOrder.map((drafter) => {
              const picks = draftedTeams.filter((entry) => entry.drafter === drafter);
              return (
                <div key={drafter} className="drafter-summary">
                  <h3>{drafter}</h3>
                  <ul>
                    {picks.map((entry, i) => (
                      <li key={i}>
                        {entry.team} <span style={{ fontSize: "0.8em" }}>+{entry.odds}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
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
