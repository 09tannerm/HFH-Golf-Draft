import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import './style.css';

function App() {
  const [draftOrder, setDraftOrder] = useState([]);
  const [teams, setTeams] = useState([]);
  const [draftedTeams, setDraftedTeams] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [draftComplete, setDraftComplete] = useState(false);

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

    const updatedDraftedTeams = [...draftedTeams, { ...team, drafter: draftOrder[currentPickIndex], roundDrafted: round }];
    setDraftedTeams(updatedDraftedTeams);
    setRedoStack([]);

    if (updatedDraftedTeams.length === teams.length) {
      setDraftComplete(true);
    }

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

  const handleUndoPick = () => {
    if (draftedTeams.length === 0) return;
    const lastPick = draftedTeams[draftedTeams.length - 1];
    setDraftedTeams(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, lastPick]);
    setDraftComplete(false);

    if (round % 2 === 1) {
      if (currentPickIndex - 1 >= 0) {
        setCurrentPickIndex(currentPickIndex - 1);
      } else {
        setRound(round - 1);
        setCurrentPickIndex(draftOrder.length - 1);
      }
    } else {
      if (currentPickIndex + 1 < draftOrder.length) {
        setCurrentPickIndex(currentPickIndex + 1);
      } else {
        setRound(round - 1);
        setCurrentPickIndex(0);
      }
    }
  };

  const handleRedoPick = () => {
    if (redoStack.length === 0) return;
    const nextPick = redoStack[redoStack.length - 1];
    const updatedDraftedTeams = [...draftedTeams, nextPick];
    setDraftedTeams(updatedDraftedTeams);
    setRedoStack(prev => prev.slice(0, -1));

    if (updatedDraftedTeams.length === teams.length) {
      setDraftComplete(true);
    }

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
    const confirmed = window.confirm('Are you sure you want to reset the draft?');
    if (confirmed) {
      setDraftedTeams([]);
      setRedoStack([]);
      setCurrentPickIndex(0);
      setRound(1);
      setDraftComplete(false);
    }
  };

  const draftedByDrafter = {};
  draftedTeams.forEach((pick) => {
    if (!draftedByDrafter[pick.drafter]) {
      draftedByDrafter[pick.drafter] = [];
    }
    draftedByDrafter[pick.drafter].push(pick);
  });

  return (
    <div className="app">
      <h1>🏌️‍♂️ HFH Golf Draft 🏆</h1>

      {draftComplete && (
        <div className="draft-complete-banner">
          🎉 Draft Complete! 🏆
        </div>
      )}

      <div className="button-group">
        <button className="reset-button" onClick={handleResetDraft}>Reset Draft</button>
        <button className="undo-button" onClick={handleUndoPick}>Undo Pick</button>
        <button className="redo-button" onClick={handleRedoPick}>Redo Pick</button>
      </div>

      <h2>
        Round {round} — {draftOrder[currentPickIndex] ? (
          <span className="on-the-clock">{draftOrder[currentPickIndex]} (On the Clock)</span>
        ) : (
          'Draft Complete!'
        )}
      </h2>

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
              {team.team} (+{team.odds})
            </button>
          ))}
      </div>

      <h2>Final Draft Summary</h2>
      <table className="draft-summary">
        <thead>
          <tr>
            <th>Drafter</th>
            <th>Pick 1</th>
            <th>Pick 2</th>
            <th>Pick 3</th>
          </tr>
        </thead>
        <tbody>
          {draftOrder.map((drafter) => (
            <tr key={drafter}>
              <td><strong>{drafter}</strong></td>
              {[0, 1, 2].map((pickIdx) => (
                <td key={pickIdx}>
                  {draftedByDrafter[drafter] && draftedByDrafter[drafter][pickIdx] ? (
                    `${draftedByDrafter[drafter][pickIdx].team} (+${draftedByDrafter[drafter][pickIdx].odds})`
                  ) : (
                    ''
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
