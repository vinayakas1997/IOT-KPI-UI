import { useMemo } from 'react';
import type { Language } from '../../types';
import type { LiveSnapshot } from '../../api/types';

interface Props {
  snapshot: LiveSnapshot;
  language: Language;
}

const T = {
  title: { en: 'Line Flow · Live Machine State', jp: 'ラインフロー · 稼働状態' },
  bottleneck: { en: 'Bottleneck', jp: 'ボトルネック' },
  running: { en: 'Running', jp: '稼働' },
  starved: { en: 'Starved', jp: '待機' },
  blocked: { en: 'Blocked', jp: '停止' },
  fault: { en: 'Fault', jp: '異常' },
  note: { en: 'packets = throughput · halo = constraint', jp: 'パケット = スループット · 光輪 = 制約' },
};

type StateKey = 'run' | 'starv' | 'block' | 'fault' | 'idle';
const STATE_COLOR: Record<StateKey, string> = {
  run: '#2dd4bf',
  starv: '#3b475f',
  block: '#fbbf24',
  fault: '#f87171',
  idle: '#3b475f',
};

function stateKey(s: string | undefined): StateKey {
  switch ((s || '').toLowerCase()) {
    case 'running':
      return 'run';
    case 'starved':
      return 'starv';
    case 'blocked':
      return 'block';
    case 'fault':
      return 'fault';
    default:
      return 'idle';
  }
}

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  r = Math.min(255, r * k);
  g = Math.min(255, g * k);
  b = Math.min(255, b * k);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

const W = 128,
  H = 74,
  D = 34,
  BASE_Y = 200,
  GAP = 60,
  START_X = 36;

export function LineFlow({ snapshot, language }: Props) {
  const { MACHINES, stateByMachine, bottleneck, machineColors } = snapshot;

  const groups = useMemo(() => {
    return MACHINES.map((name, i) => {
      const sk = stateKey(stateByMachine?.[name]);
      const isBottleneck = bottleneck.machine === name;
      const cmp = bottleneck.compare.find((c) => c.machine === name);
      const ct = cmp ? cmp.actual : bottleneck.cycleTimeActual;
      const x = START_X + i * (W + GAP);
      const c = STATE_COLOR[sk];
      return { name, sk, isBottleneck, ct, x, c, hasNext: i < MACHINES.length - 1 };
    });
  }, [MACHINES, stateByMachine, bottleneck]);

  const stateLabel: Record<StateKey, string> = {
    run: T.running[language],
    starv: T.starved[language],
    block: T.blocked[language],
    fault: T.fault[language],
    idle: T.starved[language],
  };

  return (
    <div className="card hero col-6">
      <div className="k-label">
        <span>{T.title[language]}</span>
        <span className="delta down" style={{ marginLeft: 'auto' }}>
          ▼ {T.bottleneck[language]}: {bottleneck.machine}
        </span>
      </div>
      <div className="fill">
        <svg className="fit" viewBox="0 0 1040 300" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="lf-soft" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="lf-belt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#243049" />
              <stop offset="1" stopColor="#161f31" />
            </linearGradient>
          </defs>

          {groups.map((g) => {
            const bx = g.x + W;
            const packetColor = g.isBottleneck ? '#fbbf24' : machineColors?.[g.name] || '#2dd4bf';
            const packetDur = g.sk === 'block' ? 5.5 : 2.6;
            return (
              <g key={g.name}>
                {g.hasNext && (
                  <>
                    <polygon
                      points={`${bx},${BASE_Y} ${bx + GAP},${BASE_Y} ${bx + GAP + D},${BASE_Y - D} ${bx + D},${BASE_Y - D}`}
                      fill="url(#lf-belt)"
                      stroke="#2c3a58"
                    />
                    {[0, 1, 2].map((k) => (
                      <circle key={k} r={4.5} fill={packetColor} filter="url(#lf-soft)">
                        <animateMotion
                          dur={`${packetDur}s`}
                          repeatCount="indefinite"
                          begin={`${k * (g.sk === 'block' ? 1.8 : 0.9)}s`}
                          path={`M ${bx + 8},${BASE_Y - D / 2} L ${bx + GAP + D - 8},${BASE_Y - D}`}
                        />
                      </circle>
                    ))}
                  </>
                )}

                {g.isBottleneck && (
                  <ellipse
                    cx={g.x + W / 2 + D / 2}
                    cy={BASE_Y - H / 2 - D / 2}
                    rx={W}
                    ry={H}
                    fill="none"
                    stroke="#f87171"
                    strokeWidth={2}
                    opacity={0}
                  >
                    <animate attributeName="opacity" values="0;.55;0" dur="2s" repeatCount="indefinite" />
                  </ellipse>
                )}

                <polygon
                  points={`${g.x},${BASE_Y} ${g.x + W},${BASE_Y} ${g.x + W},${BASE_Y - H} ${g.x},${BASE_Y - H}`}
                  fill={shade(g.c, 0.78)}
                  stroke="rgba(255,255,255,.08)"
                />
                <polygon
                  points={`${g.x + W},${BASE_Y} ${g.x + W + D},${BASE_Y - D} ${g.x + W + D},${BASE_Y - H - D} ${g.x + W},${BASE_Y - H}`}
                  fill={shade(g.c, 0.5)}
                  stroke="rgba(0,0,0,.2)"
                />
                <polygon
                  points={`${g.x},${BASE_Y - H} ${g.x + W},${BASE_Y - H} ${g.x + W + D},${BASE_Y - H - D} ${g.x + D},${BASE_Y - H - D}`}
                  fill={shade(g.c, 1)}
                  stroke="rgba(255,255,255,.14)"
                />

                <circle cx={g.x + W / 2 + D / 2} cy={BASE_Y - H - D / 2} r={5.5} fill={g.c} filter="url(#lf-soft)">
                  {g.sk === 'run' && (
                    <animate attributeName="opacity" values="1;.35;1" dur="1.6s" repeatCount="indefinite" />
                  )}
                </circle>

                <text x={g.x + W / 2} y={BASE_Y + 26} textAnchor="middle" className="machine-tag">
                  {g.name}
                </text>
                <text x={g.x + W / 2} y={BASE_Y + 44} textAnchor="middle" className="state-tag">
                  {stateLabel[g.sk]} · {g.ct}s
                </text>
                {g.isBottleneck && (
                  <text x={g.x + W / 2 + D / 2} y={BASE_Y - H - D - 12} textAnchor="middle" className="bottleneck-tag">
                    {T.bottleneck[language].toUpperCase()}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="legend">
        <span>
          <i style={{ background: 'var(--accent)' }} />
          {T.running[language]}
        </span>
        <span>
          <i style={{ background: '#3b475f' }} />
          {T.starved[language]}
        </span>
        <span>
          <i style={{ background: 'var(--warn)' }} />
          {T.blocked[language]}
        </span>
        <span>
          <i style={{ background: 'var(--bad)' }} />
          {T.fault[language]}
        </span>
        <span style={{ marginLeft: 'auto', color: 'var(--tx-3)' }}>{T.note[language]}</span>
      </div>

      <div className="bstrip">
        <span className="tag">
          {T.bottleneck[language].toUpperCase()} · {bottleneck.machine}
        </span>
        <span className="mn">
          {bottleneck.compare.map((c) => (
            <span key={c.machine} className={c.machine === bottleneck.machine ? 'bad' : ''}>
              {c.machine.replace('Machine ', 'M')}{' '}
              <b>
                {c.actual} / {c.ideal}
              </b>
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
