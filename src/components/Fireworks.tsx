export function Fireworks() {
  const particles = Array.from({ length: 40 });
  const colors = ["#ff3b30", "#ffcc00", "#34c759", "#5ac8fa", "#af52de", "#ff9500"];
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const dist = 200 + Math.random() * 200;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            className="absolute left-1/2 top-1/2 h-3 w-3 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}`,
              animation: `firework 1.1s ease-out forwards`,
              ["--x" as never]: `${x}px`,
              ["--y" as never]: `${y}px`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes firework {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
