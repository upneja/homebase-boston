"use client";

interface ScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeMap = {
  sm: { outer: 40, stroke: 3, textSize: "text-xs", labelSize: "text-xs", r: 16 },
  md: { outer: 52, stroke: 3.5, textSize: "text-sm", labelSize: "text-xs", r: 21 },
  lg: { outer: 88, stroke: 5, textSize: "text-2xl", labelSize: "text-sm", r: 36 },
};

export default function ScoreCircle({
  score,
  size = "md",
  label,
}: ScoreCircleProps) {
  const s = sizeMap[size];
  const center = s.outer / 2;
  const circumference = 2 * Math.PI * s.r;
  const progress = Math.min(score / 100, 1);
  const dashOffset = circumference * (1 - progress);

  const color =
    score >= 80
      ? "#1B6B5A"
      : score >= 60
        ? "#C4872A"
        : "#9C9590";

  const bgColor =
    score >= 80
      ? "#E8F5F0"
      : score >= 60
        ? "#FBF0E0"
        : "#F0ECEC";

  const glowClass =
    score >= 80
      ? "score-glow-great"
      : score >= 60
        ? "score-glow-good"
        : "";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`relative rounded-full ${glowClass} transition-all duration-300`}
        style={{ width: s.outer, height: s.outer, background: bgColor }}
      >
        {/* SVG progress ring */}
        <svg
          width={s.outer}
          height={s.outer}
          viewBox={`0 0 ${s.outer} ${s.outer}`}
          className="absolute inset-0 -rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={s.r}
            fill="none"
            stroke={color}
            strokeWidth={s.stroke}
            strokeOpacity={0.12}
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={s.r}
            fill="none"
            stroke={color}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>

        {/* Score number */}
        <span
          className={`absolute inset-0 flex items-center justify-center font-mono font-bold ${s.textSize}`}
          style={{ color }}
        >
          {score}
        </span>
      </div>

      {label && (
        <span className={`${s.labelSize} text-text-muted font-body tracking-wide uppercase`}>
          {label}
        </span>
      )}
    </div>
  );
}
