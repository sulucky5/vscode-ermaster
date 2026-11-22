import React from 'react';

export const CrowsFootMarkers: React.FC = () => {
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, pointerEvents: 'none' }}>
      <defs>
        {/* 1. 까마귀발 삼지창 (Many) - 선 색상과 100% 동일하게 context-stroke 자동 상속 */}
        <marker
          id="crows-foot-many"
          viewBox="0 0 24 24"
          refX="20"
          refY="12"
          markerWidth="16"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          {/* 중앙 선 */}
          <line x1="0" y1="12" x2="20" y2="12" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" />
          {/* 테이블 쪽으로 넓게 벌어지는 까마귀발 */}
          <path d="M 20 3 L 6 12 L 20 21" stroke="context-stroke" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </marker>

        {/* 2. 0..n (Zero or Many) : 원 + 까마귀발 */}
        <marker
          id="crows-foot-zero-many"
          viewBox="0 0 28 24"
          refX="26"
          refY="12"
          markerWidth="18"
          markerHeight="18"
          orient="auto-start-reverse"
        >
          <line x1="0" y1="12" x2="26" y2="12" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" />
          <circle cx="5" cy="12" r="3.5" stroke="context-stroke" strokeWidth="2" fill="#1e1e2e" />
          <path d="M 26 3 L 12 12 L 26 21" stroke="context-stroke" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </marker>

        {/* 3. 1..n (One or Many) : 수직선 + 까마귀발 */}
        <marker
          id="crows-foot-one-many"
          viewBox="0 0 28 24"
          refX="26"
          refY="12"
          markerWidth="18"
          markerHeight="18"
          orient="auto-start-reverse"
        >
          <line x1="0" y1="12" x2="26" y2="12" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="4" x2="6" y2="20" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" />
          <path d="M 26 3 L 12 12 L 26 21" stroke="context-stroke" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </marker>

        {/* 4. 1 (One) : 수직선 2개 (||) */}
        <marker
          id="crows-foot-one"
          viewBox="0 0 24 24"
          refX="18"
          refY="12"
          markerWidth="16"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          <line x1="0" y1="12" x2="20" y2="12" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="4" x2="8" y2="20" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" />
          <line x1="16" y1="4" x2="16" y2="20" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" />
        </marker>

        {/* 5. 0..1 (Zero or One) : 원 + 수직선 (O|) */}
        <marker
          id="crows-foot-zero-one"
          viewBox="0 0 24 24"
          refX="18"
          refY="12"
          markerWidth="16"
          markerHeight="16"
          orient="auto-start-reverse"
        >
          <line x1="0" y1="12" x2="20" y2="12" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" />
          <circle cx="6" cy="12" r="3.5" stroke="context-stroke" strokeWidth="2" fill="#1e1e2e" />
          <line x1="16" y1="4" x2="16" y2="20" stroke="context-stroke" strokeWidth="2" strokeLinecap="round" />
        </marker>

        {/* IDEF1X: 자식 끝점 채워진 원 (●) */}
        <marker
          id="idef1x-dot"
          viewBox="0 0 16 16"
          refX="12"
          refY="8"
          markerWidth="12"
          markerHeight="12"
          orient="auto-start-reverse"
        >
          <circle cx="8" cy="8" r="4.5" fill="context-stroke" />
        </marker>

        {/* IDEF1X: 부모 선택(0..1) 마름모 (◇) */}
        <marker
          id="idef1x-diamond"
          viewBox="0 0 20 16"
          refX="4"
          refY="8"
          markerWidth="14"
          markerHeight="12"
          orient="auto-start-reverse"
        >
          <polygon points="4,8 10,3 16,8 10,13" stroke="context-stroke" strokeWidth="1.8" fill="#1e1e2e" />
        </marker>
      </defs>
    </svg>
  );
};
