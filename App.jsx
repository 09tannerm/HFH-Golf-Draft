import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import './style.css';

function App() {
  const [draftOrder, setDraftOrder] = useState([]);
  const [teams, setTeams] = useState([]);
  const [draftedTeams, setDraftedTeams] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [round, setRound] = useState(1);

  useEffect(() => {
    fetch('/tournament_config.json')
      .then((res) => res.json())
      .then((data) => {
        setDraftOrder(data.draftOrder);
        setTeams(data.teams);
      })
      .catch((err) => console.error('Error loading config:', err));
  }, []);

  const handleDraftTeam = (team) => {
    if (draftedTeams.find((t) => t.team === team.team)) return;

    setDraftedTeams((prev) => [...prev, { ...team, drafter: draftOrder[currentPickIndex] }]);

    if (round % 2 === 1) {
      if (currentPickIndex + 1 < draftOrder.length) {
        setCurrentPickIndex(currentPickIndex + 1);
      } else {
        setRound(round + 1);
        setCurrentPickIndex(draftOrder.length - 1);
      }
    } else {
      if (currentPickIndex - 1 >= 0) {
        setCurrentPickIndex(currentPickIndex - 1);
      } else {
        setRound(round + 1);
        setCurrentPickIndex(0);
      }
    }
  };

  const isDrafted = (teamName) => draftedTeams.some((t) => t.team === teamName);

  const handleResetDraft = () => {
    setDraftedTeams([]);
    setCurrentPickIndex(0);
    setRound(1);
  };

  return (
    <div className="app">
      <h1>HFH Golf Draft</h1>
      <button className="reset-button" onClick={handleResetDraft}>Reset Draft</button>
      <h2>Round {round} — Drafting: {draftOrder[currentPickIndex] || 'Draft Complete!'}</h2>

      <div className="team-list">
        {teams
          .filter((team) => !isDrafted(team.team))
          .map((team, idx) => (
            <button
              key={idx}
              className="team-button"
              onClick={() => handleDraftTeam(team)}
              disabled={currentPickIndex >= draftOrder.length}
            >
              {team.team} ({team.odds})
            </button>
          ))}
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
