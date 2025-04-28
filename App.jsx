import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import './style.css';

function App() {
  const [draftOrder, setDraftOrder] = useState([]);
  const [teams, setTeams] = useState([]);
  const [draftedTeams, setDraftedTeams] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);

  useEffect(() => {
    // Load tournament_config.json
    fetch('/tournament_config.json')
      .then((res) => res.json())
      .then((data) => {
        setDraftOrder(data.draftOrder);
        setTeams(data.teams);
      })
      .catch((err) => console.error('Error loading config:', err));
  }, []);

  const handleDraftTeam = (team) => {
    if (draftedTeams.find((t) => t.team === team.team)) return; // already drafted

    setDraftedTeams((prev) => [...prev, { ...team, drafter: draftOrder[currentPickIndex] }]);
    setCurrentPickIndex((prev) => prev + 1);

    // TODO: Save pick to Firebase if needed
  };

  return (
    <div className="app">
      <h1>HFH Golf Draft</h1>
      <h2>Drafting: {draftOrder[currentPickIndex] || 'Draft Complete!'}</h2>

      <div className="team-list">
        {teams.map((team, idx) => {
          const alreadyDrafted = draftedTeams.find((t) => t.team === team.team);
          return (
            <button
              key={idx}
              className="team-button"
              onClick={() => handleDraftTeam(team)}
              disabled={!!alreadyDrafted || currentPickIndex >= draftOrder.length}
            >
              {team.team} ({team.odds})
            </button>
          );
        })}
      </div>

      <h2>Draft Board</h2>
      <div className="draft-board">
        {draftedTeams.map((pick, idx) => (
          <div key={idx} className="drafted-team">
            <strong>Pick {idx + 1}:</strong> {pick.drafter} selected {pick.team} ({pick.odds})
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
