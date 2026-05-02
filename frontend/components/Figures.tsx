// 학습지 본문에 들어가는 도형 SVG 라이브러리.
// seed.json의 problem.figure JSON을 받아 적절한 컴포넌트 렌더.

export interface Figure {
  type:
    | "circle_radius" // 원 + 중심 + 반지름
    | "circle_diameter" // 원 + 지름 (양 끝점 라벨)
    | "circle_two" // 두 원 비교 (반지름 다름)
    | "circle_concentric" // 동심원 (큰 원 + 작은 원)
    | "circle_point"; // 원 + 외부 점 + 거리
  center_label?: string; // "O", "ㄱ" 등
  radius_label?: string; // "3 cm"
  diameter_label?: string;
  point_label?: string;
  point_label_2?: string;
  radius_a?: string; // 원 1
  radius_b?: string; // 원 2
  radius_inner?: string; // 동심원 안쪽
  radius_outer?: string; // 동심원 바깥쪽
  caption?: string;
}

export function FigureRenderer({ figure }: { figure: Figure }) {
  switch (figure.type) {
    case "circle_radius":
      return <CircleRadius {...figure} />;
    case "circle_diameter":
      return <CircleDiameter {...figure} />;
    case "circle_two":
      return <CircleTwo {...figure} />;
    case "circle_concentric":
      return <CircleConcentric {...figure} />;
    case "circle_point":
      return <CirclePoint {...figure} />;
    default:
      return null;
  }
}

const STROKE = "#111827";
const ACCENT = "#1e3a8a";
const MUTED = "#6b7280";

function CircleRadius({ center_label = "O", radius_label }: Figure) {
  const r = 42;
  return (
    <FigureFrame caption={center_label && radius_label ? "" : undefined}>
      <svg width="140" height="140" viewBox="-70 -70 140 140">
        <circle cx="0" cy="0" r={r} fill="none" stroke={STROKE} strokeWidth="1.4" />
        {/* 반지름 선 */}
        <line x1="0" y1="0" x2={r} y2="0" stroke={ACCENT} strokeWidth="1" />
        {/* 중심점 */}
        <circle cx="0" cy="0" r="2.2" fill={STROKE} />
        <text x="-10" y="-6" fontSize="12" fill={STROKE} fontFamily="serif">
          {center_label}
        </text>
        {/* 반지름 라벨 */}
        {radius_label && (
          <text
            x={r / 2}
            y="-6"
            fontSize="11"
            fill={ACCENT}
            textAnchor="middle"
            fontFamily="serif"
          >
            {radius_label}
          </text>
        )}
      </svg>
    </FigureFrame>
  );
}

function CircleDiameter({
  point_label = "ㄱ",
  point_label_2 = "ㄴ",
  diameter_label,
  center_label,
}: Figure) {
  const r = 42;
  return (
    <FigureFrame>
      <svg width="160" height="120" viewBox="-80 -60 160 120">
        <circle cx="0" cy="0" r={r} fill="none" stroke={STROKE} strokeWidth="1.4" />
        {/* 지름 선 */}
        <line x1={-r} y1="0" x2={r} y2="0" stroke={ACCENT} strokeWidth="1" />
        {/* 양 끝점 */}
        <circle cx={-r} cy="0" r="2" fill={STROKE} />
        <circle cx={r} cy="0" r="2" fill={STROKE} />
        {/* 중심 */}
        {center_label && <circle cx="0" cy="0" r="2" fill={STROKE} />}
        <text x={-r - 12} y="4" fontSize="12" fill={STROKE} fontFamily="serif">
          {point_label}
        </text>
        <text x={r + 4} y="4" fontSize="12" fill={STROKE} fontFamily="serif">
          {point_label_2}
        </text>
        {center_label && (
          <text x="3" y="-5" fontSize="11" fill={STROKE} fontFamily="serif">
            {center_label}
          </text>
        )}
        {diameter_label && (
          <text x="0" y="20" fontSize="11" fill={ACCENT} textAnchor="middle" fontFamily="serif">
            {diameter_label}
          </text>
        )}
      </svg>
    </FigureFrame>
  );
}

function CircleTwo({ radius_a, radius_b }: Figure) {
  const ra = 32;
  const rb = 48;
  return (
    <FigureFrame>
      <svg width="200" height="120" viewBox="-100 -60 200 120">
        <g transform="translate(-50, 0)">
          <circle cx="0" cy="0" r={ra} fill="none" stroke={STROKE} strokeWidth="1.4" />
          <line x1="0" y1="0" x2={ra} y2="0" stroke={ACCENT} strokeWidth="1" />
          <circle cx="0" cy="0" r="2" fill={STROKE} />
          {radius_a && (
            <text
              x={ra / 2}
              y="-4"
              fontSize="11"
              fill={ACCENT}
              textAnchor="middle"
              fontFamily="serif"
            >
              {radius_a}
            </text>
          )}
        </g>
        <g transform="translate(50, 0)">
          <circle cx="0" cy="0" r={rb} fill="none" stroke={STROKE} strokeWidth="1.4" />
          <line x1="0" y1="0" x2={rb} y2="0" stroke={ACCENT} strokeWidth="1" />
          <circle cx="0" cy="0" r="2" fill={STROKE} />
          {radius_b && (
            <text
              x={rb / 2}
              y="-4"
              fontSize="11"
              fill={ACCENT}
              textAnchor="middle"
              fontFamily="serif"
            >
              {radius_b}
            </text>
          )}
        </g>
      </svg>
    </FigureFrame>
  );
}

function CircleConcentric({
  radius_inner,
  radius_outer,
  center_label = "O",
}: Figure) {
  const ri = 22;
  const ro = 48;
  return (
    <FigureFrame>
      <svg width="140" height="140" viewBox="-70 -70 140 140">
        <circle cx="0" cy="0" r={ro} fill="none" stroke={STROKE} strokeWidth="1.4" />
        <circle cx="0" cy="0" r={ri} fill="none" stroke={STROKE} strokeWidth="1.4" />
        <line x1="0" y1="0" x2={ro} y2="0" stroke={ACCENT} strokeWidth="1" />
        <circle cx="0" cy="0" r="2" fill={STROKE} />
        <text x="-10" y="-6" fontSize="12" fill={STROKE} fontFamily="serif">
          {center_label}
        </text>
        {radius_inner && (
          <text x={ri / 2} y="-22" fontSize="10" fill={MUTED} textAnchor="middle" fontFamily="serif">
            {radius_inner}
          </text>
        )}
        {radius_outer && (
          <text x={ro / 2} y="-4" fontSize="11" fill={ACCENT} textAnchor="middle" fontFamily="serif">
            {radius_outer}
          </text>
        )}
      </svg>
    </FigureFrame>
  );
}

function CirclePoint({
  center_label = "O",
  point_label = "P",
  diameter_label,
}: Figure) {
  const r = 36;
  const px = 70;
  return (
    <FigureFrame>
      <svg width="160" height="120" viewBox="-30 -60 160 120">
        <circle cx="0" cy="0" r={r} fill="none" stroke={STROKE} strokeWidth="1.4" />
        <circle cx="0" cy="0" r="2" fill={STROKE} />
        <text x="-12" y="-4" fontSize="12" fill={STROKE} fontFamily="serif">
          {center_label}
        </text>
        {/* 외부 점 */}
        <circle cx={px} cy="0" r="2.5" fill={STROKE} />
        <text x={px + 4} y="-4" fontSize="12" fill={STROKE} fontFamily="serif">
          {point_label}
        </text>
        {/* 거리 */}
        <line x1="0" y1="0" x2={px} y2="0" stroke={MUTED} strokeWidth="0.8" strokeDasharray="3,3" />
        {diameter_label && (
          <text x={px / 2} y="14" fontSize="11" fill={ACCENT} textAnchor="middle" fontFamily="serif">
            {diameter_label}
          </text>
        )}
      </svg>
    </FigureFrame>
  );
}

function FigureFrame({ children, caption }: { children: React.ReactNode; caption?: string }) {
  return (
    <div className="my-3 inline-flex flex-col items-center">
      <div className="rounded border border-dashed border-[#d1d5db] bg-white p-2 print:border-[#9ca3af]">
        {children}
      </div>
      {caption && <span className="mt-1 text-xs text-[#6b7280]">{caption}</span>}
    </div>
  );
}
