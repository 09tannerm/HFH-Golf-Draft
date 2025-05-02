
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

  const draftedByDrafter = {};
  draftedTeams.forEach((pick) => {
    if (!draftedByDrafter[pick.drafter]) {
      draftedByDrafter[pick.drafter] = [];
    }
    draftedByDrafter[pick.drafter].push(pick);
  });

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

  const updateDraftState = (newDrafted, newOverrides = overrides, newScores = scores) => {
    return setDoc(doc(db, 'draftState', 'current'), {
      draftedTeams: newDrafted,
      overrides: newOverrides,
      scores: newScores
    });
  };

  const calculateBestTwoTotal = (drafter) => {
    const allScores = [0, 1, 2].map((i) => {
      const key = `${drafter}_${i}`;
      const val = scores[key];
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    }).filter((n) => n !== null);
    if (allScores.length < 2) return '';
    allScores.sort((a, b) => a - b);
    const total = allScores.slice(0, 2).reduce((a, b) => a + b, 0);
    return total > 0 ? `+${total}` : total;
  };

  const handleCopyDraftSummary = () => {
    let text = `Draft Results for ${eventName}:

`;
    draftOrder.forEach(drafter => {
      const picks = draftedByDrafter[drafter] || [];
      const pickStr = picks.map((pick, idx) => {
        const key = `${drafter}_${idx}`;
        const raw = overrides[key] || pick.team;
        const clean = raw.replace(/\s*\(\+?\d+\)/g, '').trim();
        const score = scores[key] ? ` [${scores[key]}]` : '';
        return clean + score;
      });
      const total = calculateBestTwoTotal(drafter);
      text += `${drafter}: ${pickStr.join(', ')}${total ? \` — Total: \${total}\` : ''}
`;
    });
    navigator.clipboard.writeText(text).then(() => alert("Copied!"));
  };

  return (
    <div className="app">
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
          {draftOrder.map((drafter) => (
            <tr key={drafter}>
              <td><strong>{drafter}</strong></td>
              {[0, 1, 2].map((pickIdx) => {
                const key = `${drafter}_${pickIdx}`;
                const isEditing = editingCell === key;
                const pick = draftedByDrafter[drafter]?.[pickIdx];
                const rawName = overrides[key] || (pick ? pick.team : '');
                const name = rawName.replace(/\s*\(\+?\d+\)/g, '').trim();
                const score = scores[key] || '';
                return (
                  <td key={pickIdx}>
                    <div onClick={() => handleOverrideEdit(drafter, pickIdx)}>
                      {isEditing ? (
                        <input
                          className="override-input"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleOverrideSave(drafter, pickIdx)}
                          onKeyDown={(e) => e.key === 'Enter' && handleOverrideSave(drafter, pickIdx)}
                          autoFocus
                        />
                      ) : name}
                    </div>
                    <div>
                      <input
                        className="override-input"
                        placeholder="Score"
                        value={score}
                        onChange={(e) => handleScoreChange(drafter, pickIdx, e.target.value)}
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
