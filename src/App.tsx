/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserVote } from './components/UserVote';
import { AdminPanel } from './components/AdminPanel';
import { ResultsDisplay } from './components/ResultsDisplay';
import { TeamBuildingScoreboard } from './components/team-building-scoreboard';

export default function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen text-slate-900 font-sans overflow-x-hidden">
        <Routes>
          <Route path="/" element={<UserVote />} />
          <Route path="/admin/*" element={<AdminPanel />} />
          <Route path="/results" element={<ResultsDisplay />} />
          <Route path="/score" element={<TeamBuildingScoreboard />} />
        </Routes>
      </div>
    </Router>
  );
}
