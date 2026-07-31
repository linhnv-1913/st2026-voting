import { useEffect, useState, type FormEvent } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { ExternalLink, Loader2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import {
  createEmptyTeamBuildingScores,
  HUB_DEFINITIONS,
  normalizeTeamBuildingScores,
} from '../hubOptions';
import type { HubId, TeamBuildingScoreDocument, TeamBuildingScores } from '../types';
import './team-building-score-editor.css';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export function TeamBuildingScoreEditor() {
  const [scores, setScores] = useState<TeamBuildingScores>(createEmptyTeamBuildingScores);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  useEffect(() => onSnapshot(
    doc(db, 'team-building', 'scores'),
    snapshot => {
      const data = snapshot.data() as Partial<TeamBuildingScoreDocument> | undefined;
      setScores(normalizeTeamBuildingScores(data?.scores));
      setLoading(false);
    },
    error => {
      console.error('Failed to load team building scores', error);
      setLoading(false);
      setSaveState('error');
    },
  ), []);

  const updateScore = (hubId: HubId, rawValue: string) => {
    const value = rawValue === '' ? 0 : Number(rawValue);
    if (!Number.isFinite(value)) return;
    setSaveState('idle');
    setScores(current => ({
      ...current,
      [hubId]: Math.min(1_000_000, Math.max(0, Math.trunc(value))),
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaveState('saving');
    try {
      await setDoc(doc(db, 'team-building', 'scores'), {
        scores,
        updatedAt: Date.now(),
      } satisfies TeamBuildingScoreDocument);
      setSaveState('saved');
    } catch (error) {
      console.error('Failed to save team building scores', error);
      setSaveState('error');
    }
  };

  return (
    <section className="admin-card team-score-editor" aria-labelledby="team-score-editor-heading">
      <div className="team-score-editor__heading">
        <div>
          <h2 id="team-score-editor-heading" className="admin-section-title">Điểm Team building</h2>
          <p>Cập nhật tổng điểm đã có của từng Hub.</p>
        </div>
        <Link to="/team-building" target="_blank" rel="noreferrer" className="team-score-editor__screen-link">
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Mở bảng điểm
        </Link>
      </div>

      {loading ? (
        <div className="team-score-editor__loading" role="status">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          Đang tải điểm...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="team-score-editor__grid">
            {HUB_DEFINITIONS.map(hub => (
              <label key={hub.id} className={`team-score-editor__field team-score-editor__field--${hub.id}`}>
                <span>{hub.label}</span>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="1"
                  inputMode="numeric"
                  value={scores[hub.id]}
                  onChange={event => updateScore(hub.id, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="team-score-editor__actions">
            <span role="status" aria-live="polite">
              {saveState === 'saved' && 'Đã lưu điểm.'}
              {saveState === 'error' && 'Không thể lưu điểm. Vui lòng thử lại.'}
            </span>
            <button type="submit" disabled={saveState === 'saving'}>
              {saveState === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
              {saveState === 'saving' ? 'Đang lưu...' : 'Lưu điểm'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
