import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";

export default function ParticleBackground() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        background: { color: "transparent" },
        particles: {
          number: { value: 90, density: { enable: true, value_area: 800 } },
          color: { value: ["#2979ff", "#60a5fa"] },
          shape: { type: "circle" },
          opacity: { value: 0.5, random: true },
          size: { value: 3, random: { enable: true, minimumValue: 1 } },
          links: {
            enable: true,
            distance: 120,
            color: "#2979ff",
            opacity: 0.25,
            width: 1,
          },
          move: {
            enable: true,
            speed: 0.4,
            path: { enable: true, generator: "perlinNoise" }, // mouvement organique fluide
          },
          line_linked: {
            enable: true,
            distance: 120,
            color: "#2979ff",
            opacity: 0.25,
            width: 1,
          },
        },
        interactivity: {
          events: {
            onHover: { enable: true, mode: "repulse" },
            onClick: { enable: true, mode: "push" },
          },
          modes: {
            repulse: { distance: 100, duration: 0.4 },
            push: { quantity: 2 },
          },
        },
        detectRetina: true,
      }}
      style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}
    />
  );
}