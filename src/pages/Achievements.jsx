import { useState } from 'react'
import { ACHIEVEMENT_DEFS } from '../utils/achievements'
import { getAchievements } from '../utils/storage'

export default function Achievements() {
  const [unlocked] = useState(() => getAchievements())

  return (
    <div className="page-container">
      <div className="page-header">
        <h2><i className="fas fa-trophy"></i> 成就清单</h2>
        <span className="problem-count">
          已解锁 {ACHIEVEMENT_DEFS.filter((a) => unlocked[a.id]).length} / {ACHIEVEMENT_DEFS.length}
        </span>
      </div>
      <div className="achievement-grid">
        {ACHIEVEMENT_DEFS.map((ach) => {
          const isUnlocked = !!unlocked[ach.id]
          return (
            <div
              key={ach.id}
              className={`achievement-card ${isUnlocked ? 'achievement-unlocked' : 'achievement-locked'}`}
            >
              <div className="achievement-icon-wrap">
                <i
                  className={`fas fa-${isUnlocked ? ach.icon : 'lock'}`}
                  style={{ color: isUnlocked ? ach.color : '#bbb' }}
                ></i>
              </div>
              <div className="achievement-info">
                <h4>{ach.title}</h4>
                <p>{ach.description}</p>
              </div>
              {isUnlocked && (
                <div className="achievement-check">
                  <i className="fas fa-check-circle" style={{ color: ach.color }}></i>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
