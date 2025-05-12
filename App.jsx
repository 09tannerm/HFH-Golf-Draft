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
  const picksPerDrafter = /Masters|PGA|US Open|Open Championship|The Open/i.test(eventName) ? 5 : 3;
  const [standings, setStandings] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [scores, setScores] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');

  const draftedByDrafter = {};
  draftedTeams.forEach((pick) => {
    if (!draftedByDrafter[pick.drafter]) {
      draftedByDrafter[pick.drafter] = [];
    }
    draftedByDrafter[pick.drafter].push(pick);
  });

  useEffect(() => {
    fetch('/tournament_config.json')
      .then((res) => res.json())
      .then((data) => {
        setEventName(data.eventName || "This Week's Event");
      });

    fetch('/golfer_field.csv')
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n').slice(1);
        const parsed = lines.map(line => {
          const [team, odds] = line.split(',');
          return team && odds ? { team: team.trim(), odds: parseInt(odds.trim()) } : null;
        }).filter(Boolean);
        setTeams(parsed);
      });

    fetch('/draft_order.csv')
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n').slice(1).map(l => l.trim()).filter(Boolean);
        setDraftOrder(lines);
      });

    fetch('/standings.csv')
      .then((res) => res.text())
      .then((text) => {
        const lines = text.split('\n').slice(1);
        const parsed = lines.map(line => {
          const [name, points] = line.split(',');
          return name && points ? { name: name.trim(), points: parseFloat(points.trim()) } : null;
        }).filter(Boolean);
        setStandings(parsed);
      });
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'draftState', 'current'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDraftedTeams(data.draftedTeams || []);
        setOverrides(data.overrides || {});
        setScores(data.scores || {});
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (draftedTeams.length > 0) {
      const total = draftedTeams.length;
      const rounds = Math.floor(total / draftOrder.length);
      const even = rounds % 2 === 1;
      setCurrentPickIndex(even ? draftOrder.length - (total % draftOrder.length) - 1 : total % draftOrder.length);
      setRound(rounds + 1);
    } else {
      setCurrentPickIndex(0);
      setRound(1);
    }
    setDraftComplete(draftedTeams.length === draftOrder.length * picksPerDrafter);
  }, [draftedTeams, draftOrder]);

  const stripOdds = (name) => name.replace(/\s*\(\+?\d+\)/g, '').trim();

  const updateDraftState = (newDrafted, newOverrides = overrides, newScores = scores) => {
    return setDoc(doc(db, 'draftState', 'current'), {
      draftedTeams: newDrafted,
      overrides: newOverrides,
      scores: newScores
    });
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

  const calculateBestTwoTotal = (drafter) => {
  const all = Array.from({ length: picksPerDrafter }, (_, i) => i).map(i => {
    const val = parseFloat(scores[`${drafter}_${i}`]);
    return isNaN(val) ? null : val;
  }).filter(n => n !== null);
  if (all.length < 2) return 'CUT';
  all.sort((a, b) => a - b);
  const total = all.slice(0, 2).reduce((a, b) => a + b, 0);
  return total > 0 ? `+${total}` : `${total}`;
};
  const sortedDraftOrder = [...draftOrder].sort((a, b) => {
    const getTotal = (drafter) => {
      const scoresArr = Array.from({ length: picksPerDrafter }, (_, i) => i).map(i => {
        const val = parseFloat(scores[`${drafter}_${i}`]);
        return isNaN(val) ? null : val;
      }).filter(n => n !== null);
      if (scoresArr.length < 2) return Infinity;
      return scoresArr.sort((x, y) => x - y).slice(0, 2).reduce((a, b) => a + b, 0);
    };
    return getTotal(a) - getTotal(b);
  });


  const handleCopyDraftSummary = () => {
    let summary = `Draft Results for ${eventName}:\n\n`;
    draftOrder.forEach(drafter => {
      const picks = draftedByDrafter[drafter] || [];
      const formatted = picks.map((pick, i) => {
        const key = `${drafter}_${i}`;
        const raw = overrides[key] || pick.team;
        const score = scores[key] ? ` [${scores[key]}]` : '';
        return stripOdds(raw) + score;
      });
      const total = calculateBestTwoTotal(drafter);
      summary += `${drafter}: ${formatted.join(', ')}${total ? ` — Total: ${total}` : ''}\n`;
    });
    navigator.clipboard.writeText(summary).then(() => alert('Copied!'));
  };

  return (
    <div className="app">
      <h1>🏌️ HFH Golf Draft</h1>
      <h2>⛳ {eventName}</h2>

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

      {draftComplete && <div className="draft-complete-banner">🎉 Draft Complete! 🏆</div>}

      {!draftComplete && (
        <>
          <h2>Round {round} — <span className="on-the-clock">{draftOrder[currentPickIndex]} (On the Clock)</span></h2>
          <div className="team-list">
            {teams.filter((t) => !draftedTeams.find(p => p.team === t.team)).map((team, i) => (
              <button key={i} className="team-button" onClick={() => {
                const updated = [...draftedTeams, {
                  ...team,
                  drafter: draftOrder[currentPickIndex],
                  roundDrafted: round
                }];
                updateDraftState(updated);
                setRedoStack([]);
              }}>{team.team} (+{team.odds})</button>
            ))}
          </div>
        </>
      )}

      <div className="button-group">
        <button className="reset-button" onClick={() => {
          if (window.confirm("Reset draft?")) {
            updateDraftState([], {}, {});
            setRedoStack([]);
          }
        }}>Reset Draft</button>
        <button className="undo-button" onClick={() => {
          if (draftedTeams.length > 0) {
            const updated = draftedTeams.slice(0, -1);
            setRedoStack([...redoStack, draftedTeams.at(-1)]);
            updateDraftState(updated);
          }
        }}>Undo Pick</button>
        <button className="redo-button" onClick={() => {
          if (redoStack.length > 0) {
            const next = redoStack.at(-1);
            updateDraftState([...draftedTeams, next]);
            setRedoStack(redoStack.slice(0, -1));
          }
        }}>Redo Pick</button>
      </div>

      <h2>Final Draft Summary</h2>
      <table className="draft-summary">
        <thead>
          <tr>
            <th>Drafter</th>
            <th>Pick 1</th>
            <th>Pick 2</th>
            <th>Pick 3</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {sortedDraftOrder.map(drafter => (
            <tr key={drafter}>
              <td><strong>{drafter}</strong></td>
              {Array.from({ length: picksPerDrafter }, (_, i) => i).map(i => {
                const key = `${drafter}_${i}`;
                const isEditing = editingCell === key;
                const pick = draftedByDrafter[drafter]?.[i];
                const raw = overrides[key] || (pick?.team || '');
                const name = draftComplete ? stripOdds(raw) : raw;
                return (
                  <td key={i}>
                    <div onClick={() => handleOverrideEdit(drafter, i)}>
                      {isEditing ? (
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleOverrideSave(drafter, i)}
                          onKeyDown={(e) => e.key === 'Enter' && handleOverrideSave(drafter, i)}
                          className="override-input"
                          autoFocus
                        />
                      ) : name}
                    </div>
                    <div>
                      <input
                        className="override-input"
                        placeholder="Score"
                        value={scores[key] || ''}
                        onChange={(e) => handleScoreChange(drafter, i, e.target.value)}
                      />
                    </div>
                  </td>
                );
              })}
              <td><strong>{calculateBestTwoTotal(drafter)}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>

      {draftComplete && (
        <button className="copy-button" onClick={handleCopyDraftSummary}>
          📋 Copy Draft Summary
        </button>
      )}
    </div>
  );
}

export default App;
