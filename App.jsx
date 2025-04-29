import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import './style.css';

function App() {
  const [draftOrder, setDraftOrder] = useState([]);
  const [teams, setTeams] = useState([]);
  const [draftedTeams, setDraftedTeams] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [draftComplete, setDraftComplete] = useState(false);
  const [eventName, setEventName] = useState("This Week's Event");

  useEffect(() => {
    fetch('/tournament_config.json')
      .then((res) => res.json())
      .then((data) => {
        setDraftOrder(data.draftOrder);
        setTeams(data.teams);
        setEventName(data.eventName || "This Week's Event");
      })
      .catch((err) => console.error('Error loading config:', err));
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'draftState', 'current'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDraftedTeams(data.draftedTeams || []);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (draftedTeams.length > 0) {
      const lastPick = draftedTeams[draftedTeams.length - 1];
      const pickIndex = draftOrder.findIndex(d => d === lastPick.drafter);
      const totalPicks = draftedTeams.length;
      const roundsCompleted = Math.floor(totalPicks / draftOrder.length);
      const isEvenRound = roundsCompleted % 2 === 1;

      if (isEvenRound) {
        setCurrentPickIndex(draftOrder.length - (totalPicks % draftOrder.length) - 1);
      } else {
        setCurrentPickIndex(totalPicks % draftOrder.length);
      }
      setRound(roundsCompleted + 1);
    } else {
      setCurrentPickIndex(0);
      setRound(1);
    }

    setDraftComplete(draftedTeams.length === draftOrder.length * 3);
  }, [draftedTeams, draftOrder]);

  const updateDraftState = async (newDraftedTeams) => {
    await setDoc(doc(db, 'draftState', 'current'), { draftedTeams: newDraftedTeams });
  };

  const handleDraftTeam = (team) => {
    if (draftedTeams.find((t) => t.team === team.team)) return;

    const updatedDraftedTeams = [...draftedTeams, { ...team, drafter: draftOrder[currentPickIndex], roundDrafted: round }];
    updateDraftState(updatedDraftedTeams);
    setRedoStack([]);
  };

  const handleUndoPick = () => {
    if (draftedTeams.length === 0) return;
    const updatedDraftedTeams = draftedTeams.slice(0, -1);
    updateDraftState(updatedDraftedTeams);
    setRedoStack(prev => [...prev, draftedTeams[draftedTeams.length - 1]]);
  };

  const handleRedoPick = () => {
    if (redoStack.length === 0) return;
    const nextPick = redoStack[redoStack.length - 1];
    const updatedDraftedTeams = [...draftedTeams, nextPick];
    updateDraftState(updatedDraftedTeams);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const handleResetDraft = () => {
    const confirmed = window.confirm('Are you sure you want to reset the draft?');
    if (confirmed) {
      updateDraftState([]);
      setRedoStack([]);
    }
  };

  const handleCopyDraftSummary = () => {
    let summaryText = `Draft Results for ${eventName}:\n\n`;

    draftOrder.forEach(drafter => {
      const picks = draftedByDrafter[drafter] || [];
      const pickStrings = picks.map(pick => `${pick.team} (+${pick.odds})`);
      summaryText += `${drafter}: ${pickStrings.join(', ')}\n`;
    });

    navigator.clipboard.writeText(summaryText)
      .then(() => alert('Draft Summary copied!'))
      .catch((err) => console.error('Failed to copy:', err));
  };

  const isDrafted = (teamName) => draftedTeams.some((t) => t.team === teamName);

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
      <h2 className="event-name">⛳ {eventName}</h2>

      <div className="button-group">
        <button className="reset-button" onClick={handleResetDraft}>Reset Draft</button>
        <button className="undo-button" onClick={handleUndoPick}>Undo Pick</button>
        <button className="redo-button" onClick={handleRedoPick}>Redo Pick</button>
      </div>

      {draftComplete && (
        <div className="draft-complete-banner">
          🎉 Draft Complete! 🏆
        </div>
      )}

      {!draftComplete && (
        <>
          <h2>
            Round {round} — <span className="on-the-clock">{draftOrder[currentPickIndex]} (On the Clock)</span>
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
        </>
      )}

      {draftComplete && (
        <>
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
          <button className="copy-button" onClick={handleCopyDraftSummary}>📋 Copy Draft Summary</button>
        </>
      )}

      {/* Always show Final Draft Summary at bottom */}
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
