import React, { useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import './style.css';

function App() {
  // ... [rest of the unchanged logic] ...

  const draftedByDrafter = {};
  draftedTeams.forEach((pick) => {
    if (!draftedByDrafter[pick.drafter]) {
      draftedByDrafter[pick.drafter] = [];
    }
    draftedByDrafter[pick.drafter].push(pick);
  });

  const stripOdds = (text) => text.replace(/\s*\(\+?\d+\)/g, '').trim();

  return (
    <div className="app">
      {/* ... [header and controls] ... */}

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
                  {[0, 1, 2].map((pickIdx) => {
                    const key = `${drafter}_${pickIdx}`;
                    const isEditing = editingCell === key;
                    const pick = draftedByDrafter[drafter]?.[pickIdx];
                    const rawName = overrides[key] || (pick ? pick.team : '');
                    const name = stripOdds(rawName);
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
                          ) : (
                            name
                          )}
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
                </tr>
              ))}
            </tbody>
          </table>
          <button className="copy-button" onClick={handleCopyDraftSummary}>📋 Copy Draft Summary</button>
        </>
      )}
    </div>
  );
}

export default App;
