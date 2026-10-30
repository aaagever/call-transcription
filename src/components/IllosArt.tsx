// The animated "File uploads" drawing from Illos, shown in the empty drop zone.
//
// Adapted from the Illos Upload Dropzone on 21st.dev by @navedux. That
// component's code (this file's play logic) is MIT. The drawing itself
// (src/assets/illos-uploads.svg) is not: it is under the Illos free license,
// https://illos.dev/license (see the note at the top of the SVG file).
import { useEffect, useRef, type CSSProperties } from "react";
import uploadsSvg from "../assets/illos-uploads.svg?raw";

interface Props {
  className?: string;
  style?: CSSProperties;
}

// One object for every render: React 19 rewrites innerHTML whenever this prop's
// object changes, which replaced the drawing under the pointer on each re-render
// and swallowed the click if that happened between mouse down and mouse up.
const ART_HTML = { __html: uploadsSvg };

// Decorative: the drop zone's own text says what it means.
export function IllosArt({ className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => (ref.current ? loopInView(ref.current) : undefined), []);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`[&>svg]:h-auto [&>svg]:w-full ${className ?? ""}`}
      style={{ "--illos-play": "paused", ...style } as CSSProperties}
      dangerouslySetInnerHTML={ART_HTML}
    />
  );
}

// Loops while a quarter of it is in view, restarting each cycle on the next
// frame, and pauses off screen. Still for prefers-reduced-motion.
function loopInView(host: HTMLElement): () => void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const animations = () => host.getAnimations({ subtree: true });
  let visible = false;
  let stopped = false;
  let waiting = false;
  const loop = () => {
    if (waiting || stopped || !visible) return;
    const list = animations();
    if (!list.length) return;
    waiting = true;
    Promise.all(list.map((a) => a.finished)).then(
      () =>
        requestAnimationFrame(() => {
          waiting = false;
          if (stopped || !visible) return;
          // Seek only: play() would take a CSS animation out of CSS control.
          for (const a of animations()) a.currentTime = 0;
          loop();
        }),
      () =>
        requestAnimationFrame(() => {
          waiting = false; // an animation was cancelled: pick the loop back up
          loop();
        })
    );
  };
  const io = new IntersectionObserver(
    (entries) => {
      visible = entries.some((e) => e.isIntersecting);
      host.style.setProperty("--illos-play", visible ? "running" : "paused");
      loop();
    },
    { threshold: 0.25 }
  );
  io.observe(host);
  return () => {
    stopped = true;
    io.disconnect();
  };
}
