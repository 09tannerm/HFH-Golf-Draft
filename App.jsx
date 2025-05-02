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
  const [standings, setStandings] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [scores, setScores] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    fetch('/tournament_config.json')
      .then(res => res.json())
      .then(data => setEventName(data.eventName || "This Week's Event"));

    fetch('/golfer_field.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').slice(1);
        const loadedTeams = lines.map(line => {
          const [team, odds] = line.split(',');
          return team && odds ? { team: team.trim(), odds: parseInt(odds.trim()) } : null;
        }).filter(Boolean);
        setTeams(loadedTeams);
      });

    fetch('/draft_order.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').slice(1);
        setDraftOrder(lines.map(name => name.trim()).filter(Boolean));
      });

    fetch('/standings.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').slice(1);
        const parsed = lines.map(line => {
          const [name, points] = line.split(',');
          return name && points ? { name: name.trim(), points: parseFloat(points.trim()) } : null;
        }).filter(Boolean);
        setStandings(parsed);
      });
  }, []);

  useEffect(() => {
    return onSnapshot(doc(db, 'draftState', 'current'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDraftedTeams(data.draftedTeams || []);
        setOverrides(data.overrides || {});
        setScores(data.scores || {});
      }
    });
  }, []);

  useEffect(() => {
    const total = draftedTeams.length;
    const rounds = Math.floor(total / draftOrder.length);
    const isEven = rounds % 2 === 1;
    setCurrentPickIndex(isEven
      ? draftOrder.length - (total % draftOrder.length) - 1
      : total % draftOrder.length
    );
    setRound(rounds + 1);
    setDraftComplete(total === draftOrder.length * 3);
  }, [draftedTeams, draftOrder]);

  const updateDraftState = (newDrafted, newOverrides = overrides, newScores = scores) => {
    return setDoc(doc(db, 'draftState', 'current'), {
      draftedTeams: newDrafted,
      overrides: newOverrides,
      scores: newScores
    });
  };

  const handleDraftTeam = (team) => {
    if (draftedTeams.some(t => t.team === team.team)) return;
    const drafter = draftOrder[currentPickIndex];
    const updated = [...draftedTeams, { ...team, drafter, roundDrafted: round }];
    updateDraftState(updated);
    setRedoStack([]);
  };

  const handleUndoPick = () => {
    if (!draftedTeams.length) return;
    const updated = [...draftedTeams];
    const popped = updated.pop();
    updateDraftState(updated);
    setRedoStack(prev => [...prev, popped]);
  };

  const handleRedoPick = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    updateDraftState([...draftedTeams, next]);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const handleResetDraft = () => {
    if (window.confirm("Reset draft?")) {
      updateDraftState([], {}, {});
      setRedoStack([]);
    }
  };

  const handleOverrideEdit = (drafter, pickIdx) => {
    const key = `${drafter}_${pickIdx}`;
    setEditingCell(key);
    const pick = draftedByDrafter[drafter]?.[pickIdx];
    setEditValue(overrides[key] || (pick ? pick.team : ''));
  };

  const handleOverrideSave = (drafter, pickIdx) => {
    const key = `${drafter}_${pickIdx}`;
    const updated = { ...overrides, [key]: editValue };
    setOverrides(updated);
    updateDraftState(draftedTeams, updated, scores);
    setEditingCell(null);
  };

  const handleScoreChange = (drafter, pickIdx, value) => {
    const key = `${drafter}_${pickIdx}`;
    const updated = { ...scores, [key]: value };
    setScores(updated);
    updateDraftState(draftedTeams, overrides, updated);
  };

  const handleCopyDraftSummary = () => {
    let text = `Draft Results for ${eventName}:\n\n`;
    draftOrder.forEach(drafter => {
      const picks = draftedByDrafter[drafter] || [];
      const pickStr = picks.map((pick, idx) => {
        const key = `${drafter}_${idx}`;
        const raw = overrides[key] || pick.team;
        const score = scores[key] ? ` [${scores[key]}]` : '';
        return stripOdds(raw) + score;
      });
      text += `${drafter}: ${pickStr.join(', ')}\n`;
    });
    navigator.clipboard.writeText(text).then(() => alert("Copied!"));
  };

  const stripOdds = (text) => text.replace(/\s*\(\+?\d+\)/g, '').trim();
  const isDrafted = name => draftedTeams.some(t => t.team === name);

  const draftedByDrafter = {};
  draftedTeams.forEach(pick => {
    if (!draftedByDrafter[pick.drafter]) draftedByDrafter[pick.drafter] = [];
    draftedByDrafter[pick.drafter].push(pick);
  });

  return (
    <div className="app">
      <h1>🏌️‍♂️ HFH Golf Draft 🏆</h1>
      <h2 className="event-name">⛳ {eventName}</h2>

      {standings.length > 0 && (
        <div className="standings">
          <h3>📊 HFH Season Standings</h3>
          <ul>
            {standings.map((s, i) => (
              <li key={i}>{i + 1}. {s.name} — {s.points} pts</li>
            ))}
          </ul>
        </div>
      )}

      <div className="button-group">
        <button className="reset-button" onClick={handleResetDraft}>Reset Draft</button>
        <button className="undo-button" onClick={handleUndoPick}>Undo Pick</button>
        <button className="redo-button" onClick={handleRedoPick}>Redo Pick</button>
      </div>

      {draftComplete && (
        <div className="draft-complete-banner">🎉 Draft Complete! 🏆</div>
      )}

      {!draftComplete && (
        <>
          <h2>Round {round} — <span className="on-the-clock">{draftOrder[currentPickIndex]} (On the Clock)</span></h2>
          <div className="team-list">
            {teams.filter(team => !isDrafted(team.team)).map((team, idx) => (
              <button key={idx} className="team-button" onClick={() => handleDraftTeam(team)}>
                {team.team} (+{team.odds})
              </button>
            ))}
          </div>
        </>
      )}

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
          {draftOrder.map(drafter => (
            <tr key={drafter}>
              <td><strong>{drafter}</strong></td>
              {[0, 1, 2].map(pickIdx => {
                const key = `${drafter}_${pickIdx}`;
                const isEditing = editingCell === key;
                const pick = draftedByDrafter[drafter]?.[pickIdx];
                const raw = overrides[key] || (pick ? pick.team : '');
                const name = stripOdds(raw);
                const score = scores[key] || '';
                return (
                  <td key={pickIdx}>
                    <div onClick={() => handleOverrideEdit(drafter, pickIdx)}>
                      {isEditing ? (
                        <input
                          className="override-input"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => handleOverrideSave(drafter, pickIdx)}
                          onKeyDown={e => e.key === 'Enter' && handleOverrideSave(drafter, pickIdx)}
                          autoFocus
                        />
                      ) : name}
                    </div>
                    <div>
                      <input
                        className="override-input"
                        placeholder="Score"
                        value={score}
                        onChange={e => handleScoreChange(drafter, pickIdx, e.target.value)}
                      />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {draftComplete && (
        <button className="copy-button" onClick={handleCopyDraftSummary}>📋 Copy Draft Summary</button>
      )}
    </div>
  );
}

export default App;
