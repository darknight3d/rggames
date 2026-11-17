import React, { useEffect, useRef, useState } from "react";

type Chapter = {
  title: string;
  image: string;
  caption: string;
  text: string;
};

type Character = {
  name: string;
  image: string;
  description: string;
};

type Vehicle = {
  name: string;
  image: string;
  openImage?: string;
  frontImage?: string;
  topImage?: string;
};

type Zombie = {
  name: string;
  spritesheet: string;
};

type AssetManifest = {
  version?: number;
  title?: string;
  chapters?: Chapter[];
  characters?: Character[];
  vehicles?: Vehicle[];
  zombies?: Zombie[];
  assets?: string[];
};

type ZombieMob = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  hp: number;
};

const defaultManifest: AssetManifest = {
  title: "MINIBUS MISFITS ZOMBIE",
  chapters: [
    {
      title: "The Short-Bus Outbreak",
      image: "1.png",
      caption: "The field trip begins",
      text: "The yellow NeoTech minibus idles outside Apex Synthetic Bio-Corp while the crew steps into a crisis they are badly prepared for.",
    },
    {
      title: "The Parking Lot Standoff",
      image: "2.png",
      caption: "The quiet before the chaos",
      text: "The bus sits dead beneath blinking hazard lights as the sidewalks empty and the horde starts to move.",
    },
  ],
  characters: [
    {
      name: "Timmy",
      image: "SSCharacters01.png",
      description: "Megaphone in hand, ready to warn everybody about everything.",
    },
    {
      name: "Gary",
      image: "SSCharacters01.png",
      description: "A thoughtful observer of wrappers, hubcaps, and mysteries.",
    },
  ],
  vehicles: [
    {
      name: "NeoTech USD-400 minibus",
      image: "MinibusClosed.png",
      openImage: "MinibusOpen.png",
      frontImage: "MinibusFront.png",
      topImage: "MinibusTop.png",
    },
  ],
  zombies: [
    { name: "Quarantine-zone zombies", spritesheet: "SSZombie1.png" },
    { name: "Wanderer zombies", spritesheet: "SSZombie2.png" },
  ],
  assets: [
    "1.png",
    "2.png",
    "3.png",
    "4.png",
    "5.png",
    "GameCover.png",
    "MinibusClosed.png",
    "MinibusOpen.png",
    "MinibusFront.png",
    "MinibusTop.png",
    "SSCharacters01.png",
    "SSCharacters02.png",
    "SSZombie1.png",
    "SSZombie2.png",
  ],
};

export default function Game(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scene, setScene] = useState<AssetManifest>(defaultManifest);
  const [missionStatus, setMissionStatus] = useState("Stay close to the bus and clear the lane.");

  useEffect(() => {
    let cancelled = false;

    fetch("./assets.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Missing assets.json");
        }
        return response.json() as Promise<AssetManifest>;
      })
      .then((manifest) => {
        if (!cancelled) {
          setScene({ ...defaultManifest, ...manifest });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setScene(defaultManifest);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const width = 920;
    const height = 560;
    const centerX = width / 2;
    const centerY = height / 2;

    const bus = {
      x: 180,
      y: 360,
      width: 150,
      height: 80,
    };

    const player = {
      x: 520,
      y: 280,
      radius: 18,
      speed: 180,
    };

    const zombies: ZombieMob[] = Array.from({ length: 5 }, (_, index) => ({
      x: 700 + index * 25,
      y: 150 + index * 75,
      radius: 16 + (index % 3) * 3,
      speed: 35 + index * 10,
      hp: 2,
    }));

    let animationFrame = 0;
    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      context.clearRect(0, 0, width, height);
      context.fillStyle = "#1b1e1a";
      context.fillRect(0, 0, width, height);

      context.fillStyle = "#4d4a3e";
      context.fillRect(0, 160, width, 260);

      context.fillStyle = "#c8b88d";
      context.fillRect(0, 200, width, 12);
      context.fillRect(0, 360, width, 12);

      context.fillStyle = "#94a144";
      for (let i = 0; i < 12; i += 1) {
        const x = i * 80 + 20;
        context.fillRect(x, 230, 34, 100);
      }

      const busImage = new Image();
      busImage.src = "./MinibusClosed.png";
      if (busImage.complete) {
        context.drawImage(busImage, bus.x, bus.y, bus.width, bus.height);
      } else {
        context.fillStyle = "#e2b34b";
        context.fillRect(bus.x, bus.y, bus.width, bus.height);
      }

      const missionText = scene.title ?? "MINIBUS MISFITS ZOMBIE";
      context.fillStyle = "#f5d88d";
      context.font = "bold 22px sans-serif";
      context.fillText(missionText, 24, 54);

      context.fillStyle = "#f0e2bd";
      context.font = "16px sans-serif";
      context.fillText("Field Trip 7B • Parking Lot Standoff", 24, 82);

      const playerGlow = Math.sin(time * 0.006) * 6;
      context.beginPath();
      context.fillStyle = "#b7d45b";
      context.arc(player.x, player.y + playerGlow, player.radius, 0, Math.PI * 2);
      context.fill();

      zombies.forEach((zombie) => {
        const dx = player.x - zombie.x;
        const dy = player.y - zombie.y;
        const distance = Math.hypot(dx, dy) || 1;
        zombie.x += (dx / distance) * zombie.speed * delta * 0.7;
        zombie.y += (dy / distance) * zombie.speed * delta * 0.7;

        context.beginPath();
        context.fillStyle = "#7b8d57";
        context.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
        context.fill();
      });

      const distanceToBus = Math.hypot(player.x - bus.x, player.y - bus.y);
      if (distanceToBus < 150) {
        setMissionStatus("Bus nearby — use the mission prompt to recover health.");
      } else {
        setMissionStatus("Stay close to the bus and clear the lane.");
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    animationFrame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [scene]);

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "24px auto",
        padding: 18,
        borderRadius: 12,
        background: "#171a16",
        color: "#f0e2bd",
        fontFamily: "Georgia, serif",
        boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
          borderBottom: "1px solid rgba(255,255,255,0.14)",
          paddingBottom: 10,
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 12, letterSpacing: 3, color: "#b7d45b", textTransform: "uppercase" }}>
            Field Trip 7B
          </div>
          <h2 style={{ margin: "8px 0 0", fontSize: 32, color: "#f6c943" }}>{scene.title ?? "MINIBUS MISFITS ZOMBIE"}</h2>
        </div>
        <button
          type="button"
          style={{
            background: "#c89528",
            color: "#17150f",
            border: "none",
            borderRadius: 999,
            padding: "10px 18px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Play Mission
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 18,
        }}
      >
        <div>
          <canvas
            ref={canvasRef}
            width={920}
            height={560}
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.18)",
              background: "#1b1e1a",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#b7d45b", textTransform: "uppercase" }}>
              Mission Status
            </div>
            <p style={{ margin: "10px 0 0", lineHeight: 1.6 }}>{missionStatus}</p>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#b7d45b", textTransform: "uppercase" }}>
              Story Overview
            </div>
            <p style={{ margin: "10px 0 0", lineHeight: 1.6 }}>
              {scene.chapters?.[0]?.text ?? "The minibus crew faces a quarantine-zone outbreak and must find a way to survive the parking lot."}
            </p>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 2, color: "#b7d45b", textTransform: "uppercase" }}>
              Assets Loaded
            </div>
            <ul style={{ margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.8 }}>
              {(scene.assets ?? defaultManifest.assets ?? []).slice(0, 8).map((asset) => (
                <li key={asset}>{asset}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
