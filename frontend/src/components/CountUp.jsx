import { useEffect, useState } from "react";
import { animate } from "framer-motion";

// Animates a number counting up from 0 to `value` — used for the score reveal.
export default function CountUp({ value, suffix = "", duration = 1.2 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span>
      {display}
      {suffix}
    </span>
  );
}
