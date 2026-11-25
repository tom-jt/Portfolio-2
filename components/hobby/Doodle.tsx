import type { HobbyId } from "@/data/hobby/hobbies";

/**
 * A small line drawing of Tom doing each hobby. Lines take the text colour,
 * shapes are filled with the page ground so they read as cut-outs, and the
 * accents use the hobby's colour, so each one suits both themes.
 */

const BG = "var(--background)";
const HB = "var(--hb)";

const LABEL: Record<HobbyId, string> = {
  magic: "Doodle of a person in a top hat fanning out playing cards",
  ice: "Doodle of a person skating on one foot with arms spread",
  balisong: "Doodle of a person flipping a balisong trainer, with motion lines",
  piano: "Doodle of a person playing a small keyboard, with music notes",
};

const Magic = () => (
  <>
    <path d="M70 98q20-8 40 0l8 54H62z" fill={BG} />
    <circle cx="90" cy="72" r="24" fill={BG} />
    <path d="M64 52h52M72 52V28h36v24" fill={BG} />
    <path d="M72 45h36" stroke={HB} strokeWidth="4" />
    <circle cx="82" cy="72" r="2.2" fill="currentColor" stroke="none" />
    <circle cx="98" cy="72" r="2.2" fill="currentColor" stroke="none" />
    <ellipse cx="75" cy="80" rx="4" ry="2.5" fill={HB} stroke="none" opacity="0.55" />
    <ellipse cx="105" cy="80" rx="4" ry="2.5" fill={HB} stroke="none" opacity="0.55" />
    <path d="M85 82q5 4 10 0" />
    <path d="M72 108q-18 4-26-12M46 96l-14-22" />
    <path d="M28 60v9M23.5 64.5h9" stroke={HB} />
    <path d="M108 108q16 0 24-18" />
    <rect x="124" y="58" width="17" height="24" rx="2.5" fill={BG} transform="rotate(-22 132 82)" />
    <rect x="126" y="56" width="17" height="24" rx="2.5" fill={BG} />
    <rect x="128" y="58" width="17" height="24" rx="2.5" fill={BG} transform="rotate(22 136 82)" />
    <path
      d="M136 66c-2.6-3.2-7-.8-5 2.4l5 5 5-5c2-3.2-2.4-5.6-5-2.4z"
      transform="rotate(22 136 82)"
      fill={HB}
      stroke="none"
    />
    <path d="M80 152v18M100 152v18M74 170h10M96 170h10" />
  </>
);

const Ice = () => (
  <>
    <path d="M18 172q44-16 92-4" stroke={HB} strokeDasharray="4 7" opacity="0.8" />
    <path d="M88 78l-6 46h28l-4-46z" fill={BG} />
    <path d="M88 86q-22-2-42 12M106 86q22-8 44 0" />
    <circle cx="96" cy="54" r="22" fill={BG} />
    <path d="M75 48q21-30 42 0z" fill={HB} />
    <circle cx="96" cy="22" r="5" fill="currentColor" stroke="none" />
    <path d="M86 56q3-3 6 0M100 56q3-3 6 0M91 64q5 4 10 0" />
    <ellipse cx="83" cy="62" rx="3.6" ry="2.3" fill={HB} stroke="none" opacity="0.6" />
    <ellipse cx="109" cy="62" rx="3.6" ry="2.3" fill={HB} stroke="none" opacity="0.6" />
    <path d="M80 78q16 8 32 0M84 80q-16 8-30 0" stroke={HB} strokeWidth="5" />
    <path d="M93 124l2 34M102 124q20 10 40 2" />
    <path d="M86 158h16v6H84z" fill={BG} />
    <path d="M80 168h28" stroke={HB} />
  </>
);

const Balisong = () => (
  <>
    <path d="M118 30a34 34 0 0 1 40 26" stroke={HB} strokeDasharray="3 7" />
    <path d="M112 46a22 22 0 0 1 30 4" stroke={HB} strokeDasharray="3 7" />
    <path d="M70 98q20-8 40 0l6 54H64z" fill={BG} />
    <circle cx="88" cy="72" r="24" fill={BG} />
    <path d="M66 62l6-14 6 8 6-12 6 12 6-10 6 12 6-6" />
    <circle cx="80" cy="73" r="2.2" fill="currentColor" stroke="none" />
    <circle cx="96" cy="73" r="2.2" fill="currentColor" stroke="none" />
    <ellipse cx="73" cy="81" rx="4" ry="2.5" fill={HB} stroke="none" opacity="0.55" />
    <ellipse cx="103" cy="81" rx="4" ry="2.5" fill={HB} stroke="none" opacity="0.55" />
    <path d="M83 83q5 3 10 0" />
    <path d="M70 108q-12 10-4 22l8-4" />
    <path d="M108 106q14-6 20-26" />
    <path d="M126 82l8-26M131 84l9-25" strokeWidth="5" />
    <path d="M130 58l18-14" stroke={HB} strokeWidth="3" />
    <path d="M80 152v18M100 152v18M74 170h10M96 170h10" />
  </>
);

const Piano = () => (
  <>
    <path d="M132 30v-16l14 4M132 30a5 5 0 1 1-5-5h5z" stroke={HB} />
    <path d="M150 56V42l10 3M150 56a4 4 0 1 1-4-4h4z" stroke={HB} />
    <path d="M66 106q24-10 48 0l4 26H62z" fill={BG} />
    <circle cx="90" cy="76" r="24" fill={BG} />
    <path
      d="M68 70q4-26 30-22q16 4 16 20q-10-12-28-8q-10 2-18 10z"
      fill="currentColor"
      strokeWidth="1.5"
    />
    <path d="M80 80q3-3 6 0M94 80q3-3 6 0M86 88q4 3 8 0" />
    <ellipse cx="76" cy="86" rx="3.6" ry="2.3" fill={HB} stroke="none" opacity="0.6" />
    <ellipse cx="104" cy="86" rx="3.6" ry="2.3" fill={HB} stroke="none" opacity="0.6" />
    <path d="M68 114q-8 10 0 20M112 114q8 10 0 20" />
    <rect x="30" y="134" width="120" height="30" rx="3" fill={BG} />
    <path d="M45 134v30M60 134v30M75 134v30M90 134v30M105 134v30M120 134v30M135 134v30" />
    <path
      d="M41 134h8v16h-8zM56 134h8v16h-8zM86 134h8v16h-8zM101 134h8v16h-8zM116 134h8v16h-8z"
      fill="currentColor"
      stroke="none"
    />
    <path d="M30 164l-4 12M150 164l4 12" />
  </>
);

const DRAWINGS: Record<HobbyId, () => React.ReactElement> = {
  magic: Magic,
  ice: Ice,
  balisong: Balisong,
  piano: Piano,
};

const Doodle = ({ hobby, size = 128 }: { hobby: HobbyId; size?: number }) => {
  const Drawing = DRAWINGS[hobby];
  return (
    <svg
      className="hb-draw text-foreground"
      width={size}
      height={size}
      viewBox="0 0 180 180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={LABEL[hobby]}
    >
      <Drawing />
    </svg>
  );
};

export default Doodle;
