import { useId } from "react";
import type { PotId } from "@/lib/home/cosmetics";
import type { PlantId } from "@/lib/home/garden";
import { cn } from "@/lib/utils";

/** The "mixed" pots: each plant in its own colour. */
const POT: Record<PlantId, string> = {
  moss: "#b86a4b",
  fern: "#d9cbb4",
  mint: "#7f9c86",
  monstera: "#3e4b70",
  bonsai: "#9ab8a8",
  moonflower: "#6c4a7f",
  lotus: "#4f8fa6",
  willow: "#8a6e52",
  cloudbloom: "#c9d6ea",
  rainlily: "#8fb7c9",
  cedar: "#6f7f8f",
  stormorchid: "#4a3a6a",
  worldtree: "#9a7a4a",
};

/** Foliage for each plant, drawn upward from the soil line at y=32. */
const FOLIAGE: Partial<Record<PlantId, React.ReactNode>> = {
  moss: (
    <g>
      <circle cx="14" cy="30" r="4.5" fill="#5f8f4e" />
      <circle cx="26" cy="30" r="4.5" fill="#5f8f4e" />
      <circle cx="20" cy="28" r="5.5" fill="#79a85f" />
      <circle cx="16.5" cy="26.8" r="2.6" fill="#8fbd6c" />
      <circle cx="23.5" cy="27.2" r="2.2" fill="#8fbd6c" />
    </g>
  ),
  fern: (
    <g fill="#5ea36a">
      {[-62, -32, 0, 32, 62].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 20 32)`}>
          <ellipse cx="20" cy="21" rx="3.4" ry="11" />
          <line
            x1="20"
            y1="31"
            x2="20"
            y2="11"
            stroke="#3f7d4a"
            strokeWidth="0.8"
          />
        </g>
      ))}
    </g>
  ),
  mint: (
    <g>
      {[
        [13, -14],
        [20, 0],
        [27, 14],
      ].map(([x, lean]) => (
        <g key={x} transform={`rotate(${lean} 20 32)`}>
          <line
            x1="20"
            y1="32"
            x2="20"
            y2="10"
            stroke="#4f8b5d"
            strokeWidth="1.3"
          />
          {[14, 20, 26].map((y) => (
            <g key={y}>
              <ellipse cx="16.6" cy={y} rx="3.4" ry="2.4" fill="#7cc58f" />
              <ellipse cx="23.4" cy={y - 2} rx="3.4" ry="2.4" fill="#6ab57f" />
            </g>
          ))}
        </g>
      ))}
    </g>
  ),
  monstera: (
    <g>
      <path
        d="M20 32 C19 26 15 22 11 19 M20 32 C21 25 25 21 29 18 M20 32 L20 12"
        stroke="#2f6b45"
        strokeWidth="1.3"
        fill="none"
      />
      {[
        [11, 18, -25],
        [29, 17, 25],
        [20, 11, 0],
      ].map(([cx, cy, rot]) => (
        <g key={`${cx}`} transform={`rotate(${rot} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx="7" ry="6.2" fill="#3f8a5a" />
          <path
            d={`M${cx} ${cy} l-5.5 -2.5 M${cx} ${cy} l-5.8 1.6 M${cx} ${cy} l5.5 -2.5 M${cx} ${cy} l5.8 1.6`}
            stroke="#2a6342"
            strokeWidth="1"
          />
        </g>
      ))}
    </g>
  ),
  bonsai: (
    <g>
      <path
        d="M19 32 C17 27 23 25 21 21 C19.5 18 15 18 13 15"
        stroke="#6b4a3a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M21 22 C24 20 27 19 29 16"
        stroke="#6b4a3a"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="12.5" cy="13" rx="7" ry="4" fill="#4f8a55" />
      <ellipse cx="28.5" cy="14" rx="6" ry="3.6" fill="#66a364" />
      <ellipse cx="20" cy="9" rx="5.5" ry="3.4" fill="#5a9a5d" />
    </g>
  ),
  moonflower: (
    <g>
      <path
        d="M20 32 C20 24 21 18 20 12"
        stroke="#4f8b5d"
        strokeWidth="1.4"
        fill="none"
      />
      <ellipse
        cx="15"
        cy="25"
        rx="4.2"
        ry="2.2"
        fill="#5f9e6c"
        transform="rotate(-30 15 25)"
      />
      <ellipse
        cx="25"
        cy="21"
        rx="4.2"
        ry="2.2"
        fill="#5f9e6c"
        transform="rotate(30 25 21)"
      />
      <g style={{ filter: "drop-shadow(0 0 3px rgba(240,236,255,0.9))" }}>
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse
            key={deg}
            cx="20"
            cy="6.5"
            rx="3"
            ry="4.6"
            fill="#f5f1ff"
            transform={`rotate(${deg} 20 11)`}
          />
        ))}
        <circle cx="20" cy="11" r="2.2" fill="#ffe9a8" />
      </g>
    </g>
  ),
  lotus: (
    <g>
      <ellipse cx="20" cy="30.5" rx="12" ry="2.6" fill="#3f8a5a" />
      <path d="M20 30.5 L27 28.6" stroke="#2f6b45" strokeWidth="0.8" />
      {[-48, -24, 0, 24, 48].map((deg) => (
        <ellipse
          key={deg}
          cx="20"
          cy="21"
          rx="3.2"
          ry="7"
          fill={deg === 0 ? "#ffd3e2" : "#f4a8c4"}
          transform={`rotate(${deg} 20 28)`}
        />
      ))}
      <ellipse cx="20" cy="24.5" rx="2.6" ry="2" fill="#ffe08a" />
    </g>
  ),
  willow: (
    <g>
      <path
        d="M20 32 C20 26 19 20 20 13"
        stroke="#6b4a3a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="20" cy="12" rx="11" ry="5.5" fill="#6aa564" />
      {[10, 13.5, 17, 20.5, 24, 27.5, 31].map((x, i) => (
        <path
          key={x}
          d={`M${x} 13 C${x - 0.6} 18 ${x + 0.4} 22 ${x - 0.3} ${25 + (i % 3) * 1.6}`}
          stroke={i % 2 ? "#7dbb6e" : "#5a9a5d"}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
  ),
  cloudbloom: (
    <g>
      <path
        d="M20 32 C19 27 21 22 20 17"
        stroke="#4f8b5d"
        strokeWidth="1.4"
        fill="none"
      />
      <ellipse
        cx="16"
        cy="27"
        rx="3.6"
        ry="1.8"
        fill="#5f9e6c"
        transform="rotate(-25 16 27)"
      />
      <g style={{ filter: "drop-shadow(0 0 3px rgba(200,225,255,0.8))" }}>
        <circle cx="15" cy="13" r="4.4" fill="#eef4ff" />
        <circle cx="20.5" cy="10.5" r="5.4" fill="#f7faff" />
        <circle cx="25.8" cy="13.4" r="4.2" fill="#e6efff" />
        <rect x="12" y="13" width="17" height="4" rx="2" fill="#eef4ff" />
      </g>
      {[15.5, 20.5, 25.5].map((x, i) => (
        <path
          key={x}
          d={`M${x} ${19.5 + (i % 2)} q-0.9 1.6 0 2.4 q0.9 -0.8 0 -2.4Z`}
          fill="#8fc8f0"
        />
      ))}
    </g>
  ),
};

const FOLIAGE_LATE: Record<
  "rainlily" | "cedar" | "stormorchid" | "worldtree",
  React.ReactNode
> = {
  // Rain lily: white trumpets on tall stems, a drop at each lip.
  rainlily: (
    <g>
      {[
        [15, -12],
        [25, 10],
      ].map(([x, lean]) => (
        <g key={x} transform={`rotate(${lean} 20 32)`}>
          <path
            d={`M20 32 C20 24 20 18 20 12`}
            stroke="#4f8b5d"
            strokeWidth="1.2"
            fill="none"
          />
          <path d="M20 12 L15.5 6 Q20 8.5 24.5 6 Z" fill="#f7f9ff" />
          <path
            d="M20 12 L17 5 M20 12 L23 5"
            stroke="#dfe7f2"
            strokeWidth="0.6"
          />
          <ellipse cx="24.2" cy="7.6" rx="0.8" ry="1.1" fill="#8fd0f2" />
        </g>
      ))}
      <path
        d="M14 32 Q15 24 13 20 M26 32 Q25 25 28 21"
        stroke="#5f9e6c"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </g>
  ),
  // Cedar: a tall conifer with a wisp of cloud caught in it.
  cedar: (
    <g>
      <rect x="19" y="26" width="2" height="6" fill="#5a3f2c" />
      {[
        [27, 9],
        [21, 7.5],
        [15, 6],
        [9.5, 4.5],
      ].map(([y, half]) => (
        <path
          key={y}
          d={`M20 ${y - 8} L${20 + half} ${y} L${20 - half} ${y} Z`}
          fill={y > 20 ? "#2f6b45" : "#3a7d52"}
        />
      ))}
      <ellipse cx="24" cy="15" rx="6" ry="1.8" fill="#f2f6ff" opacity="0.85" />
      <ellipse cx="15" cy="21" rx="4.5" ry="1.4" fill="#f2f6ff" opacity="0.7" />
    </g>
  ),
  // Storm orchid: violet petals with a lightning-yellow throat.
  stormorchid: (
    <g>
      <path
        d="M20 32 C19 26 21 20 20 15"
        stroke="#4f8b5d"
        strokeWidth="1.3"
        fill="none"
      />
      <ellipse
        cx="14"
        cy="29"
        rx="5"
        ry="2"
        fill="#4f8a5a"
        transform="rotate(-15 14 29)"
      />
      <ellipse
        cx="26"
        cy="29"
        rx="5"
        ry="2"
        fill="#4f8a5a"
        transform="rotate(15 26 29)"
      />
      {[0, 72, 144, 216, 288].map((d) => (
        <ellipse
          key={d}
          cx="20"
          cy="8.5"
          rx="2.8"
          ry="4.6"
          fill="#8a5ad8"
          transform={`rotate(${d} 20 12)`}
        />
      ))}
      <path
        d="M20 9 l-1.6 3 h2 l-1.4 3.4"
        stroke="#ffe066"
        strokeWidth="1"
        fill="none"
        strokeLinejoin="round"
      />
    </g>
  ),
  // World tree: a broad old crown, faintly glowing.
  worldtree: (
    <g>
      <path
        d="M17 32 C18 26 17 22 15 19 M23 32 C22 26 23 22 25 19 M20 32 V18"
        stroke="#6b4a3a"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <g style={{ filter: "drop-shadow(0 0 2.5px rgba(200,255,170,0.7))" }}>
        <ellipse cx="20" cy="12" rx="13" ry="7.5" fill="#3f8a4a" />
        <ellipse cx="13" cy="14" rx="7" ry="4.5" fill="#4a9a52" />
        <ellipse cx="27" cy="14" rx="7" ry="4.5" fill="#4a9a52" />
        <ellipse cx="20" cy="8" rx="8" ry="4.5" fill="#5aae5e" />
      </g>
      {[
        [12, 11],
        [27, 9],
        [20, 5.5],
        [16, 15],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.7" fill="#fff6c2" />
      ))}
    </g>
  ),
};
Object.assign(FOLIAGE, FOLIAGE_LATE);

/** A pot style's paint, as an SVG fill plus whatever detail it carries. */
function potPaint(pot: PotId, plant: PlantId, gid: string) {
  switch (pot) {
    case "classic":
      return { fill: POT[plant] };
    case "terracotta":
      return { fill: "#c0714f" };
    case "porcelain":
      return {
        fill: "#eef0f4",
        detail: (
          <rect x="10.6" y="39.4" width="18.8" height="1.6" fill="#4a6fb5" />
        ),
      };
    case "stone":
      return {
        fill: "#8a8f8a",
        detail: (
          <g fill="#6f9a55">
            <circle cx="12" cy="31.6" r="1.6" />
            <circle cx="15" cy="31.2" r="1.2" />
            <circle cx="27" cy="31.5" r="1.5" />
            <circle cx="19" cy="40" r="0.9" opacity="0.8" />
          </g>
        ),
      };
    case "copper":
      // Copper, weathered green in patches along the rim and down a side.
      return {
        fill: `url(#${gid})`,
        gradient: ["#d9894f", "#8a4b2a"],
        detail: (
          <g fill="#5fae8f" opacity="0.8">
            <ellipse cx="12" cy="32.6" rx="2.4" ry="1.1" />
            <ellipse cx="25.5" cy="33.2" rx="1.8" ry="0.9" />
            <ellipse cx="13.5" cy="40" rx="1.2" ry="2.2" />
            <circle cx="24" cy="43" r="0.9" />
            <circle cx="27" cy="38.5" r="0.6" opacity="0.7" />
          </g>
        ),
      };
    case "midnight":
      return {
        fill: "#1e2547",
        detail: (
          <g fill="#cfd8ff">
            <circle cx="14" cy="39" r="0.5" />
            <circle cx="21" cy="42" r="0.45" />
            <circle cx="25.5" cy="38.4" r="0.55" />
            <circle cx="17.5" cy="44" r="0.4" />
          </g>
        ),
      };
    case "gilded":
      return { fill: `url(#${gid})`, gradient: ["#f6d977", "#b3862a"] };
    case "diamond":
      // Ice-pale facets, and a glint that catches the light.
      return {
        fill: `url(#${gid})`,
        gradient: ["#f4fdff", "#8fd3f2"],
        detail: (
          <g>
            <path
              d="M12 35.5 L16 46 M20 35.5 V46 M28 35.5 L24 46 M10 31 L14 35.5 M30 31 L26 35.5"
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.7"
            />
            <path
              d="M17 38.5 L20 35.5 L23 38.5 L20 44 Z"
              fill="#ffffff"
              opacity="0.35"
            />
            <path
              d="M26.5 37.5 l0.6 -1.7 l0.6 1.7 l1.7 0.6 l-1.7 0.6 l-0.6 1.7 l-0.6 -1.7 l-1.7 -0.6 Z"
              fill="#ffffff"
            />
          </g>
        ),
      };

    // Made for each scene.
    case "slick":
      // Rainy window: wet, glossy navy, with drops running down it.
      return {
        fill: `url(#${gid})`,
        gradient: ["#34508a", "#141c33"],
        detail: (
          <g fill="#ffffff">
            <rect
              x="12.5"
              y="36.5"
              width="1.4"
              height="8"
              rx="0.7"
              opacity="0.35"
            />
            <ellipse cx="22" cy="39" rx="0.8" ry="1.1" opacity="0.6" />
            <ellipse cx="25.5" cy="42.5" rx="0.7" ry="1" opacity="0.5" />
          </g>
        ),
      };
    case "daisy":
      // The hill: meadow-green glaze, painted with daisies.
      return {
        fill: "#7fb77e",
        detail: (
          <g>
            {[
              [15, 40],
              [24.5, 42.5],
            ].map(([x, y]) => (
              <g key={x}>
                {[0, 72, 144, 216, 288].map((d) => (
                  <circle
                    key={d}
                    cx={x + 1.5 * Math.cos((d * Math.PI) / 180)}
                    cy={y + 1.5 * Math.sin((d * Math.PI) / 180)}
                    r="0.9"
                    fill="#ffffff"
                  />
                ))}
                <circle cx={x} cy={y} r="0.8" fill="#ffd34d" />
              </g>
            ))}
          </g>
        ),
      };
    case "dusk":
      // The sunset: glazed from sun-orange down to evening violet.
      return { fill: `url(#${gid})`, gradient: ["#ffa06b", "#6b3a8a"] };
    case "marble":
      // The café: speckled cream stone with a brown dipped rim.
      return {
        fill: "#e9dcc6",
        detail: (
          <g>
            <rect x="8" y="31" width="24" height="2.4" rx="1" fill="#7a4a2a" />
            {[
              [13, 38],
              [18, 42],
              [23, 37.5],
              [26, 41],
              [15.5, 44],
              [21, 40],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" fill="#8a6a4a" />
            ))}
          </g>
        ),
      };
    case "borealis":
      // The aurora lake: deep teal into violet, a band of light across it.
      return {
        fill: `url(#${gid})`,
        gradient: ["#2a7a74", "#3f2a74"],
        detail: (
          <path
            d="M10 40 Q14 37 18 40 T26 40 T31 39"
            stroke="#8ff5cf"
            strokeWidth="1.1"
            fill="none"
            opacity="0.8"
          />
        ),
      };
    case "bark":
      // The sunlit forest: a hollowed log, grain and a knot.
      return {
        fill: "#6b4a32",
        detail: (
          <g stroke="#4a3221" strokeWidth="0.6" fill="none">
            <path d="M13 36 Q12.5 41 14 46 M18 36 Q19 41 17.5 46 M24 36 Q23 41 24.5 46 M28 36 Q28.5 40 27 45" />
            <ellipse cx="21" cy="41" rx="1.4" ry="1" />
          </g>
        ),
      };
    case "nebula":
      // The nebula: violet into deep blue, stars and a drift of pink gas.
      return {
        fill: `url(#${gid})`,
        gradient: ["#4a2f8a", "#121a44"],
        detail: (
          <g>
            <ellipse
              cx="19"
              cy="40"
              rx="6"
              ry="2.4"
              fill="#ff8fd0"
              opacity="0.28"
            />
            {[
              [13, 38],
              [24, 37.5],
              [27, 42],
              [16, 43.5],
              [21, 44.5],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" fill="#ffffff" />
            ))}
          </g>
        ),
      };
    case "coral":
      // The tropical sunset: coral pink, ridged like a shell.
      return {
        fill: "#ff8a73",
        detail: (
          <g stroke="#ffc2b2" strokeWidth="0.6" fill="none" opacity="0.8">
            <path d="M13 36 Q15 41 14 46 M17 36 Q18 41 17.5 46 M21 36 V46 M25 36 Q24 41 24.5 46 M28.5 36 Q27 41 27 45" />
          </g>
        ),
      };
    case "enamel":
      // The alpine hill: white enamel with a blue rim and an edelweiss.
      return {
        fill: "#f4f6f8",
        detail: (
          <g>
            <rect
              x="8"
              y="31"
              width="24"
              height="4.5"
              rx="1.2"
              fill="#2f5fa8"
            />
            <rect
              x="9"
              y="32.2"
              width="22"
              height="0.7"
              fill="#ffffff"
              opacity="0.3"
            />
            {[0, 60, 120, 180, 240, 300].map((d) => (
              <ellipse
                key={d}
                cx={20 + 1.8 * Math.cos((d * Math.PI) / 180)}
                cy={40.5 + 1.8 * Math.sin((d * Math.PI) / 180)}
                rx="1.1"
                ry="0.6"
                transform={`rotate(${d} ${20 + 1.8 * Math.cos((d * Math.PI) / 180)} ${40.5 + 1.8 * Math.sin((d * Math.PI) / 180)})`}
                fill="#dfe6e0"
                stroke="#b8c4bb"
                strokeWidth="0.2"
              />
            ))}
            <circle cx="20" cy="40.5" r="0.9" fill="#e8d35a" />
          </g>
        ),
      };
    case "maple":
      // The autumn path: rust glaze with a gold maple leaf.
      return {
        fill: "#b5532a",
        detail: (
          <path
            d="M20 36.5 l0.8 2.2 1.5 -0.8 -0.4 2 2.1 -0.3 -1.2 1.6 1.4 0.8 -2.6 0.2 0.3 1.2 -1.6 -0.7 V45 h-0.6 v-2.3 l-1.6 0.7 0.3 -1.2 -2.6 -0.2 1.4 -0.8 -1.2 -1.6 2.1 0.3 -0.4 -2 1.5 0.8 Z"
            fill="#f2b33d"
          />
        ),
      };
    case "ashen":
      // Majula: grey stone, cracked, with an ember glowing inside.
      return {
        fill: "#5b5753",
        detail: (
          <g>
            <path
              d="M15 35.5 L17 39 L15.5 41.5 L18.5 46"
              stroke="#ff9a3c"
              strokeWidth="0.8"
              fill="none"
              style={{ filter: "drop-shadow(0 0 1.5px #ff7a2a)" }}
            />
            <path
              d="M25 37 L23.5 40 L25.5 43"
              stroke="#ff9a3c"
              strokeWidth="0.6"
              fill="none"
              opacity="0.8"
            />
          </g>
        ),
      };
    case "leather":
      // The night library: bound in brown leather, ridged like a spine,
      // with a gold-tooled title.
      return {
        fill: "#6b3a24",
        detail: (
          <g>
            <path
              d="M10.2 38 H29.8 M10.8 41 H29.2 M11.4 44 H28.6"
              stroke="#4a2616"
              strokeWidth="0.7"
            />
            <rect x="16" y="38.8" width="8" height="1.6" rx="0.3" fill="#d6b05a" />
            <path d="M8 33.2 H32" stroke="#d6b05a" strokeWidth="0.5" />
          </g>
        ),
      };
    case "knit":
      // The snowed-in cabin: a cream jumper with a red Fair Isle band.
      return {
        fill: "#efe4d0",
        detail: (
          <g>
            <path
              d="M9 33.2 H31"
              stroke="#d8ccb6"
              strokeWidth="2.6"
              strokeDasharray="0.6 0.9"
            />
            <path
              d="M10.6 39.5 l1.5 -1.5 1.5 1.5 1.5 -1.5 1.5 1.5 1.5 -1.5 1.5 1.5 1.5 -1.5 1.5 1.5 1.5 -1.5 1.5 1.5 1.5 -1.5 1.5 1.5"
              stroke="#b8322e"
              strokeWidth="0.9"
              fill="none"
            />
            {[12.5, 16, 19.5, 23, 26.5].map((x) => (
              <circle key={x} cx={x} cy="42.6" r="0.55" fill="#3f6b4a" />
            ))}
          </g>
        ),
      };
    case "sleeper":
      // The night train: carriage navy, gold lining, and a lit window.
      return {
        fill: "#1f2c55",
        detail: (
          <g>
            <path d="M10.2 37.4 H29.8 M11.6 44 H28.4" stroke="#d6b05a" strokeWidth="0.5" />
            <rect x="15.5" y="38.8" width="9" height="3.6" rx="0.6" fill="#ffc46b" />
            <path d="M20 38.8 V42.4" stroke="#1f2c55" strokeWidth="0.5" />
          </g>
        ),
      };
    case "glasshouse":
      // The greenhouse: misted glass in white glazing bars, beaded with rain.
      return {
        fill: "#bcd9cf",
        detail: (
          <g>
            <path
              d="M14 35.5 L15 46 M20 35.5 V46 M26 35.5 L25 46 M9.9 40.5 H30.1"
              stroke="#f4faf7"
              strokeWidth="0.7"
            />
            <rect x="8" y="31" width="24" height="4.5" rx="1.2" fill="#e8f2ee" />
            {[
              [12, 38],
              [17.5, 43],
              [23, 37.5],
              [27.5, 43.5],
            ].map(([x, y]) => (
              <ellipse key={x} cx={x} cy={y} rx="0.5" ry="0.7" fill="#ffffff" opacity="0.8" />
            ))}
          </g>
        ),
      };
    case "sunrise":
      // The desk at dawn: glazed lilac up to peach, with light through the
      // blinds slanting across it.
      return {
        fill: `url(#${gid})`,
        gradient: ["#ffb38a", "#b79ad8"],
        detail: (
          <path
            d="M10 41 L22 36 M11 44 L26 37 M14 46 L29 39"
            stroke="#fff3dc"
            strokeWidth="1"
            opacity="0.45"
          />
        ),
      };
    case "tram":
      // The rainy tram stop: the tram's livery, mint over pink, a white
      // stripe between, and a row of its windows.
      return {
        fill: "#bfe8cf",
        detail: (
          <g>
            <path d="M10.8 40.8 H29.2 L28 46 H12 Z" fill="#f6c1cf" />
            <rect x="10.6" y="40.2" width="18.8" height="0.8" fill="#ffffff" />
            {[12.8, 17.2, 21.6, 26].map((x) => (
              <rect
                key={x}
                x={x}
                y="36.6"
                width="2.4"
                height="2.2"
                rx="0.3"
                fill="#eef8f2"
                stroke="#7fae95"
                strokeWidth="0.35"
              />
            ))}
          </g>
        ),
      };
    case "reclaimed":
      // The overgrown city: cracked concrete, moss on the rim, and a strip
      // of pink neon still lit.
      return {
        fill: "#8d8f8a",
        detail: (
          <g>
            <g fill="#5f8f45">
              <circle cx="11" cy="31.8" r="1.5" />
              <circle cx="13.8" cy="31.4" r="1" />
              <circle cx="28.2" cy="32" r="1.3" />
              <circle cx="25.8" cy="31.4" r="0.8" />
            </g>
            <path
              d="M24 36 L22.6 39 L24 41.2"
              stroke="#5c5e5a"
              strokeWidth="0.5"
              fill="none"
            />
            <path
              d="M12.4 43 H23.5"
              stroke="#ff6fcf"
              strokeWidth="0.9"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 1.5px #ff4fc0)" }}
            />
          </g>
        ),
      };
    case "signage":
      // The hazy overpass: weathered concrete pasted with a faded shop sign,
      // grime streaking down from the rim, and a dot of neon.
      return {
        fill: "#8f8a80",
        detail: (
          <g>
            <rect x="11" y="37.4" width="13" height="4.6" rx="0.4" fill="#c25a50" />
            <path
              d="M12.6 38.6 V40.8 M12.6 39.7 H14.4 M15.6 38.6 H17.6 V40.8 M19 38.6 V40.8 H21 M22.2 38.6 V40.8"
              stroke="#fff4e4"
              strokeWidth="0.55"
            />
            <rect x="24.6" y="37.4" width="4" height="4.6" rx="0.4" fill="#4f78a8" />
            <path d="M25.6 38.6 H27.6 M25.6 40 H27.6" stroke="#e8eef8" strokeWidth="0.5" />
            <path
              d="M12 35.6 V37 M18 35.6 V36.8 M27 35.6 V37.2 M15 42.4 V45 M25.5 42.4 V44.2"
              stroke="#5a554c"
              strokeWidth="0.5"
              opacity="0.7"
            />
            <circle
              cx="14"
              cy="43.8"
              r="0.6"
              fill="#ff6fcf"
              style={{ filter: "drop-shadow(0 0 1.2px #ff4fc0)" }}
            />
          </g>
        ),
      };
    case "wood":
      // Oak: warm wood with the grain running down it.
      return {
        fill: "#7a4e2a",
        detail: (
          <g stroke="#5e3a1d" strokeWidth="0.6" fill="none">
            <path d="M12.5 36 Q13.5 41 13 46 M16.5 36 Q15.5 41 16.5 46 M21 36 Q22 41 21 46 M25 36 Q24 41 25 46 M28.5 36 Q28 40 27.5 45" />
            <rect
              x="8"
              y="31"
              width="24"
              height="4.5"
              rx="1.2"
              fill="#8a5a31"
              stroke="none"
            />
          </g>
        ),
      };
    case "stained":
      // Stained glass: pastel panes in pale leading, with a sheen.
      return {
        fill: `url(#${gid})`,
        gradient: ["#f6c9d4", "#c6dbf3"],
        detail: (
          <g>
            <path
              d="M10 36 L20 46 M30 36 L20 46 M15 36 L25 46 M25 36 L15 46"
              stroke="#f7f4ee"
              strokeWidth="0.8"
            />
            <path d="M12.5 37 L16 37 L13.5 42 Z" fill="#ffffff" opacity="0.4" />
          </g>
        ),
      };
    case "brass":
      // Brass: polished, with a row of rivets round the rim.
      return {
        fill: `url(#${gid})`,
        gradient: ["#e6c47e", "#8a6424"],
        detail: (
          <g fill="#f3dca2">
            {[11, 15.5, 20, 24.5, 29].map((x) => (
              <circle key={x} cx={x} cy="33.3" r="0.8" />
            ))}
          </g>
        ),
      };
    case "gothic":
      // The candlelit cathedral: dark carved stone, gold-trimmed, with a
      // pointed window of blue glass glowing in it.
      return {
        fill: "#3e3c46",
        detail: (
          <g>
            <rect x="8" y="31" width="24" height="4.5" rx="1.2" fill="#4a4752" />
            <path d="M8.4 33.2 H31.6" stroke="#c9a24a" strokeWidth="0.5" />
            <path
              d="M17.2 45.6 V40 Q20 35.8 22.8 40 V45.6 Z"
              fill="#8fc2ff"
              style={{ filter: "drop-shadow(0 0 1.4px #7fb4ff)" }}
            />
            <path
              d="M20 37.4 V45.6 M17.2 41.6 H22.8"
              stroke="#2a2830"
              strokeWidth="0.45"
            />
            <path
              d="M16.6 45.8 V40 Q20 34.8 23.4 40 V45.8"
              stroke="#c9a24a"
              strokeWidth="0.5"
              fill="none"
            />
            <path d="M10.6 38 L12 46 M29.4 38 L28 46" stroke="#2a2830" strokeWidth="0.5" />
          </g>
        ),
      };
    case "frost":
      // Moonlight: icy blue, rimed with frost.
      return {
        fill: `url(#${gid})`,
        gradient: ["#eef7ff", "#9cc4e8"],
        detail: (
          <g stroke="#ffffff" strokeWidth="0.45" opacity="0.85">
            <path d="M13 38 l2 2 M15 38 l-2 2 M14 37.6 v2.8 M25 41 l2 2 M27 41 l-2 2 M26 40.6 v2.8" />
            <rect
              x="8"
              y="31"
              width="24"
              height="1.4"
              rx="0.7"
              fill="#ffffff"
              stroke="none"
              opacity="0.7"
            />
          </g>
        ),
      };
  }
}

/** Growth stage from how many are owned: a sprout, then fuller, then full. */
export const stageFor = (count: number) =>
  count >= 25 ? 3 : count >= 10 ? 2 : 1;

const SCALE = { 1: 0.72, 2: 0.86, 3: 1 } as const;

const PlantSprite = ({
  id,
  stage = 3,
  size = 40,
  locked = false,
  pot = "classic",
  gold = false,
  className,
}: {
  id: PlantId;
  stage?: 1 | 2 | 3;
  size?: number;
  locked?: boolean;
  pot?: PotId;
  /** Gold-leaf foliage, the level-100 reward. */
  gold?: boolean;
  className?: string;
}) => {
  const s = SCALE[stage];
  const gid = useId().replace(/:/g, "");
  const paint = potPaint(pot, id, gid);
  return (
    <svg
      viewBox="0 0 40 48"
      width={size}
      height={size * 1.2}
      aria-hidden="true"
      className={cn(
        locked && "opacity-40 brightness-0 invert-[0.35]",
        className,
      )}
    >
      {paint.gradient && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={paint.gradient[0]} />
            <stop offset="1" stopColor={paint.gradient[1]} />
          </linearGradient>
        </defs>
      )}
      <g
        transform={`translate(20 32) scale(${s}) translate(-20 -32)`}
        style={
          gold
            ? {
                filter:
                  "sepia(1) saturate(2.6) hue-rotate(-12deg) brightness(1.12) drop-shadow(0 0 1.5px rgba(255,214,110,0.8))",
              }
            : undefined
        }
      >
        {FOLIAGE[id]}
      </g>
      <rect x="8" y="31" width="24" height="4.5" rx="1.2" fill={paint.fill} />
      <path d="M9.5 35.5 H30.5 L28 46 H12 Z" fill={paint.fill} />
      {paint.detail}
      <path d="M9.5 35.5 H30.5 L30.1 37.2 H9.9 Z" fill="black" opacity="0.18" />
      <rect
        x="9"
        y="31.6"
        width="22"
        height="1"
        rx="0.5"
        fill="white"
        opacity="0.18"
      />
    </svg>
  );
};

export default PlantSprite;
