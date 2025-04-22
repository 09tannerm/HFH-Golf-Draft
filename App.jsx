import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./style.css";

const zurichTeams = [{'team': 'Shane Lowry / Rory McIlroy', 'odds': 360}, {'team': 'Kurt Kitayama / Collin Morikawa', 'odds': 1200}, {'team': 'Thomas Detry / Robert MacIntyre', 'odds': 1800}, {'team': 'J.T. Poston / Keith Mitchell', 'odds': 1800}, {'team': 'Taylor Moore / Wyndham Clark', 'odds': 2200}, {'team': 'Andrew Novak / Ben Griffin', 'odds': 2200}, {'team': 'Aaron Rai / Sahith Theegala', 'odds': 2500}, {'team': 'Rasmus Højgaard / Nicolai Højgaard', 'odds': 2800}, {'team': 'Billy Horschel / Tom Hoge', 'odds': 2800}, {'team': 'Max Greyserman / Nico Echavarria', 'odds': 3000}, {'team': 'Brice Garnett / Sepp Straka', 'odds': 3300}, {'team': 'Ryan Fox / Garrick Higgo', 'odds': 3500}, {'team': 'Akshay Bhatia / Carson Young', 'odds': 3500}, {'team': 'Nick Taylor / Adam Hadwin', 'odds': 3500}, {'team': 'Jesper Svensson / Niklas Norgaard', 'odds': 3500}, {'team': 'Laurie Canter / Jordan Smith', 'odds': 4000}, {'team': 'Michael Thorbjornsen / Karl Vilips', 'odds': 4000}, {'team': 'Thorbjørn Olesen / Matt Wallace', 'odds': 4000}, {'team': 'Alejandro Tosti / Joe Highsmith', 'odds': 4000}, {'team': 'Matt Fitzpatrick / Alex Fitzpatrick', 'odds': 4500}, {'team': 'Jhonattan Vegas / Kevin Yu', 'odds': 4500}, {'team': 'Rico Hoey / Sam Ryder', 'odds': 4500}, {'team': 'Joseph Bramlett / Alex Smalley', 'odds': 4500}, {'team': 'Max McGreevy / Sam Stevens', 'odds': 4500}, {'team': 'Jacob Bridgeman / Chandler Phillips', 'odds': 5000}, {'team': 'Doug Ghim / Chan Kim', 'odds': 5500}, {'team': 'Ryan Gerard / Danny Walker', 'odds': 5500}, {'team': 'Erik van Rooyen / Christiaan Bezuidenhout', 'odds': 5500}, {'team': 'Cam Davis / Adam Svensson', 'odds': 6000}, {'team': 'Quade Cummins / Chris Gotterup', 'odds': 6000}, {'team': 'Beau Hossler / Andrew Putnam', 'odds': 6000}, {'team': 'Victor Perez / Matthieu Pavon', 'odds': 6500}, {'team': 'Nate Lashley / Hayden Springer', 'odds': 6500}, {'team': 'Harry Higgs / Joel Dahmen', 'odds': 7000}, {'team': 'Bud Cauley / Kevin Tway', 'odds': 7000}, {'team': 'Frankie Capan III / Jake Knapp', 'odds': 7500}, {'team': 'Jeremy Paul / Yannik Paul', 'odds': 7500}, {'team': 'Luke List / Henrik Norlander', 'odds': 8000}, {'team': 'Ryo Hisatsune / Takumi Kanaya', 'odds': 8000}, {'team': 'Si Woo Kim / Sangmoon Bae', 'odds': 8000}, {'team': 'William Mouw / Ricky Castillo', 'odds': 8000}, {'team': 'Justin Lower / Chad Ramey', 'odds': 8000}, {'team': 'Patrick Fishburn / Zac Blair', 'odds': 8000}, {'team': 'Jackson Suber / Pierceson Coody', 'odds': 8000}, {'team': 'Cameron Champ / Lanto Griffin', 'odds': 9000}, {'team': 'Davis Riley / Nick Hardy', 'odds': 9000}, {'team': 'Sami Valimaki / Ben Silverman', 'odds': 10000}, {'team': 'Isaiah Salinda / Kevin Velo', 'odds': 10000}, {'team': 'Robby Shelton / Trey Mullinax', 'odds': 10000}, {'team': 'Kris Ventura / Antoine Rozner', 'odds': 10000}, {'team': 'Mac Meissner / Noah Goodwin', 'odds': 10000}, {'team': 'Adam Schenk / Tyler Duncan', 'odds': 11000}, {'team': 'Tim Widing / Steven Fisk', 'odds': 11000}, {'team': 'Angel Ayora / Alejandro Del Rey', 'odds': 11000}, {'team': 'Matt McCarty / Mason Andersen', 'odds': 12000}, {'team': 'Vince Whaley / Anders Albertson', 'odds': 12000}, {'team': 'Kevin Roy / Trevor Cone', 'odds': 15000}, {'team': 'Ryan Brehm / Mark Hubbard', 'odds': 15000}, {'team': 'Sam Saunders / Eric Cole', 'odds': 15000}, {'team': 'Will Gordon / Matthew Riedel', 'odds': 17000}, {'team': 'Zach Johnson / Ryan Palmer', 'odds': 17000}, {'team': 'Nick Watney / Charley Hoffman', 'odds': 17000}, {'team': 'Cristobal Del Solar / Matteo Manassero', 'odds': 20000}, {'team': 'Rikuya Hoshino / Kaito Onishi', 'odds': 20000}, {'team': 'Patton Kizzire / Ben Kohles', 'odds': 20000}, {'team': 'Taylor Montgomery / John Pak', 'odds': 22000}, {'team': 'Paul Peterson / Thomas Rosenmueller', 'odds': 22000}, {'team': 'Chez Reavie / Brandt Snedeker', 'odds': 22000}, {'team': 'David Lipsky / Dylan Wu', 'odds': 25000}, {'team': 'Kevin Kisner / Greyson Sigg', 'odds': 25000}, {'team': 'Russell Knox / Peter Malnati', 'odds': 25000}, {'team': 'Taylor Dickson / Trace Crowe', 'odds': 25000}, {'team': 'Will Chandler / Matt NeSmith', 'odds': 27000}, {'team': 'Bill Haas / Martin Laird', 'odds': 27000}, {'team': 'Ben Taylor / David Skinns', 'odds': 30000}, {'team': 'Chesson Hadley / Jonathan Byrd', 'odds': 30000}, {'team': 'Robert Streb / Troy Merritt', 'odds': 40000}, {'team': 'Camilo Villegas / Luke Donald', 'odds': 50000}, {'team': 'Braden Thornberry / Hayden Buckley', 'odds': 50000}];

const draftOrder = [
  "Connor Cremers", "Connor Woods", "Tyler Chase", "Kevan Elcock", "Trevor Elcock", "Brett Smith",
  "Ryne Borden", "Jack Berry", "Tyler Ehlers", "Tanner Morris", "David Johnson", "Kyle Serrano"
];

function App() {
  const [availableTeams, setAvailableTeams] = useState(() =>
    JSON.parse(localStorage.getItem("availableTeams")) || zurichTeams
  );
  const [draftedTeams, setDraftedTeams] = useState(() =>
    JSON.parse(localStorage.getItem("draftedTeams")) || []
  );
  const [currentPickIndex, setCurrentPickIndex] = useState(() =>
    parseInt(localStorage.getItem("currentPickIndex")) || 0
  );

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
    if (currentPickIndex >= draftOrder.length * 3) return;
    setDraftedTeams(prev => [...prev, {
      pick: currentPickIndex + 1,
      team: teamObj.team,
      odds: teamObj.odds,
      drafter: getCurrentPicker()
    }]);
    setAvailableTeams(prev => prev.filter(t => t.team !== teamObj.team));
    setCurrentPickIndex(prev => prev + 1);
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
