// Dragon Hábitos — PWA standalone (React global + Babel standalone, sin build step)
const { useState, useEffect, useCallback, useMemo } = React;

// ---------- Helpers de fecha ----------
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS_CORTOS = ["L", "M", "X", "J", "V", "S", "D"];

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}
function weekdayIndex(year, monthIndex, day) {
  const jsDay = new Date(year, monthIndex, day).getDay();
  return (jsDay + 6) % 7;
}
function monthKey(year, monthIndex) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}
function buildWeeks(year, monthIndex) {
  const total = daysInMonth(year, monthIndex);
  const weeks = [];
  let current = [];
  for (let d = 1; d <= total; d++) {
    current.push(d);
    const wd = weekdayIndex(year, monthIndex, d);
    if (wd === 6 || d === total) {
      weeks.push(current);
      current = [];
    }
  }
  return weeks;
}
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_HABITS = [
  { id: uid(), name: "Entrenar", color: "#FF6B1A" },
  { id: uid(), name: "Leer 10 min", color: "#2E9BD6" },
  { id: uid(), name: "Dormir 7h+", color: "#FFC83D" },
];

// ---------- Almacenamiento local (persiste en el iPhone sin internet) ----------
const LS_HABITS = "dragonhabitos:habits";
const LS_CHECKS = "dragonhabitos:checks";

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

// ---------- Niveles de poder (según % del mes) ----------
function nivelPara(pct) {
  if (pct === 0) return { key: "bebe", label: "Recién nacido", aura: "#BFE3F2", img: "warriors/warrior-1.png" };
  if (pct < 40) return { key: "base", label: "Entrenando", aura: "#E2D9C9", img: "warriors/warrior-2.png" };
  if (pct < 70) return { key: "ssj", label: "Super nivel 1", aura: "#FFD23F", img: "warriors/warrior-3.png" };
  if (pct < 100) return { key: "ssjblue", label: "Super nivel 2", aura: "#4FC3F7", img: "warriors/warrior-4.png" };
  return { key: "ultra", label: "Instinto superior", aura: "#E8E8F0", img: "warriors/warrior-4.png" };
}

// ---------- Figura del guerrero: imágenes provistas por el usuario, con aura/rayos generados por código ----------
function Warrior({ pct, size = 96 }) {
  const lvl = nivelPara(pct);
  const isUltra = lvl.key === "ultra";
  const isSsjBlue = lvl.key === "ssjblue";
  const isSsj = lvl.key === "ssj";
  const energized = isSsj || isSsjBlue || isUltra;
  const height = size * 1.4;

  return (
    <div style={{ position: "relative", width: size, height, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      {pct > 0 && (
        <div
          className={isUltra ? "aura-ultra" : energized ? "aura-pulse" : ""}
          style={{
            position: "absolute",
            inset: -size * 0.22,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${lvl.aura}77 0%, ${lvl.aura}2a 48%, transparent 76%)`,
            filter: "blur(2px)",
          }}
        />
      )}
      {energized && (
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          style={{ position: "absolute", top: -size * 0.08, left: 0 }}
          className="spin-slow"
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = (i * 360) / 10;
            return (
              <rect
                key={i}
                x="49"
                y="1"
                width="1.6"
                height={isUltra ? 13 : 9}
                fill={lvl.aura}
                opacity={0.9}
                transform={`rotate(${angle} 50 50)`}
              />
            );
          })}
        </svg>
      )}
      <img
        src={lvl.img}
        alt={lvl.label}
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: "100%",
          maxHeight: "100%",
          height: "100%",
          width: "auto",
          objectFit: "contain",
          filter: pct > 0 ? `drop-shadow(0 0 ${size * 0.08}px ${lvl.aura}99)` : "none",
        }}
      />
    </div>
  );
}

// ---------- Insignia general del mes (promedio de todos los hábitos) ----------
function rangoPara(pct) {
  if (pct === 0) return { key: "madera", label: "Madera", stars: 0, color: [120, 85, 52], rim: [54, 35, 20], glow: null };
  if (pct < 15) return { key: "bronce", label: "Bronce", stars: 1, color: [175, 96, 48], rim: [82, 42, 16], glow: [170, 95, 45] };
  if (pct < 30) return { key: "plata", label: "Plata", stars: 2, color: [208, 215, 224], rim: [118, 128, 140], glow: [205, 213, 222] };
  if (pct < 50) return { key: "oro", label: "Oro", stars: 3, color: [224, 168, 28], rim: [120, 84, 8], glow: [255, 205, 70], rays: true };
  if (pct < 70) return { key: "platino", label: "Platino", stars: 4, color: [210, 222, 232], rim: [120, 140, 155], glow: [215, 230, 240] };
  if (pct < 85) return { key: "diamante", label: "Diamante", stars: 5, color: [186, 120, 240], rim: [108, 50, 165], glow: [190, 130, 255] };
  if (pct < 100) return { key: "heroico", label: "Heroico", stars: 6, color: [214, 48, 42], rim: [110, 16, 16], glow: [255, 80, 50], rays: true };
  return { key: "maestro", label: "Maestro", stars: 7, color: [245, 244, 255], rim: [180, 175, 225], glow: [200, 190, 255], rays: true };
}

function rgb(arr, a = 1) {
  return `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${a})`;
}

// Estrellas distribuidas dentro del círculo: 1 al centro, 2+ en anillo.
function starPositions(n, r) {
  if (n <= 0) return [];
  if (n === 1) return [[0, 0]];
  const ringR = r * 0.5;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const ang = (-90 + (i * 360) / n) * (Math.PI / 180);
    pts.push([ringR * Math.cos(ang), ringR * Math.sin(ang)]);
  }
  return pts;
}

function starPath(cx, cy, r, innerRatio = 0.46) {
  let d = "";
  for (let i = 0; i < 10; i++) {
    const ang = (-90 + i * 36) * (Math.PI / 180);
    const rad = i % 2 === 0 ? r : r * innerRatio;
    const x = cx + rad * Math.cos(ang);
    const y = cy + rad * Math.sin(ang);
    d += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " ";
  }
  return d + "Z";
}

function RankBadge({ pct, size = 120 }) {
  const rango = rangoPara(pct);
  const id = React.useId ? React.useId() : "rb";
  const r = 42;
  const cx = 50, cy = 50;
  const starR = rango.stars >= 6 ? 6.5 : rango.stars >= 4 ? 7.5 : rango.stars === 1 ? 11 : 9;
  const starColorMap = {
    madera: null,
    bronce: "rgba(96,50,20,0.95)",
    plata: "rgba(122,132,145,0.95)",
    oro: "rgba(140,96,12,0.95)",
    platino: "rgba(130,150,165,0.95)",
    diamante: "rgba(108,32,170,0.95)",
    heroico: "rgba(255,205,60,0.95)",
    maestro: "rgba(170,160,235,0.95)",
  };
  const stars = starPositions(rango.stars, r);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {rango.glow && (
        <div
          className={rango.key === "maestro" ? "aura-ultra" : "aura-pulse"}
          style={{
            position: "absolute",
            inset: -size * 0.22,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${rgb(rango.glow, 0.55)} 0%, ${rgb(rango.glow, 0.18)} 48%, transparent 76%)`,
            filter: "blur(2px)",
          }}
        />
      )}
      {rango.rays && (
        <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "absolute", inset: 0 }} className="spin-slow">
          {Array.from({ length: 16 }).map((_, i) => {
            const ang = (i * 360) / 16;
            return (
              <rect key={i} x="49" y="1" width="1.6" height="9" fill={rgb(rango.glow)} opacity="0.85"
                transform={`rotate(${ang} 50 50)`} />
            );
          })}
        </svg>
      )}
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: "relative", zIndex: 2 }}>
        <defs>
          <radialGradient id={`rg-${rango.key}`} cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor={rgb(rango.color)} />
            <stop offset="100%" stopColor={rgb(rango.rim)} />
          </radialGradient>
        </defs>
        {rango.key === "madera" ? (
          <g>
            <circle cx={cx} cy={cy} r={r} fill={`url(#rg-${rango.key})`} stroke={rgb(rango.rim)} strokeWidth="2.5" />
            {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
              <path key={i} d={`M ${cx - r * 0.85} ${cy + i * 10} Q ${cx} ${cy + i * 10 + 6} ${cx + r * 0.85} ${cy + i * 10}`}
                fill="none" stroke="rgba(58,38,22,0.4)" strokeWidth="2" />
            ))}
          </g>
        ) : (
          <circle cx={cx} cy={cy} r={r} fill={`url(#rg-${rango.key})`} stroke={rgb(rango.rim)} strokeWidth="2.5" />
        )}
        {stars.map(([dx, dy], i) => (
          <path key={i} d={starPath(cx + dx, cy + dy, starR)} fill={starColorMap[rango.key]} />
        ))}
      </svg>
    </div>
  );
}

// ---------- Iconos propios (sin dependencias externas) ----------
function DragonBallIcon({ size = 20, dots = 1 }) {
  const positions = {
    1: [[50, 50]],
    2: [[35, 35], [65, 65]],
    3: [[50, 28], [32, 62], [68, 62]],
    4: [[35, 32], [65, 32], [35, 68], [65, 68]],
    5: [[50, 22], [28, 42], [72, 42], [38, 75], [62, 75]],
    6: [[50, 18], [28, 36], [72, 36], [50, 50], [32, 70], [68, 70]],
    7: [[50, 16], [26, 32], [74, 32], [50, 48], [22, 60], [78, 60], [50, 80]],
  };
  const pts = positions[dots] || positions[1];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="#FFA52E" stroke="#C2490C" strokeWidth="4" />
      <circle cx="38" cy="36" r="14" fill="#FFC56B" opacity="0.5" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" fill="#D32F2F" />
      ))}
    </svg>
  );
}

function CloudShape() {
  return (
    <svg width="90" height="34" viewBox="0 0 90 34">
      <ellipse cx="22" cy="22" rx="20" ry="11" fill="#FFF6E0" opacity="0.55" />
      <ellipse cx="45" cy="16" rx="24" ry="14" fill="#FFF6E0" opacity="0.55" />
      <ellipse cx="68" cy="22" rx="18" ry="10" fill="#FFF6E0" opacity="0.55" />
    </svg>
  );
}

function ChevronLeft({ size = 20, color = "#000" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight({ size = 20, color = "#000" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon({ size = 18, color = "#000" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
function XIcon({ size = 18, color = "#000" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function TrashIcon({ size = 16, color = "#fff" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HabitTracker() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getMonth());
  const [habits, setHabits] = useState(() => loadLocal(LS_HABITS, DEFAULT_HABITS));
  const [checks, setChecks] = useState(() => loadLocal(LS_CHECKS, {}));
  const [adding, setAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [saveError, setSaveError] = useState(false);
  const [focusHabit, setFocusHabit] = useState(null);

  const mKey = monthKey(year, monthIndex);
  const totalDays = daysInMonth(year, monthIndex);
  const weeks = useMemo(() => buildWeeks(year, monthIndex), [year, monthIndex]);

  useEffect(() => {
    const ok = saveLocal(LS_HABITS, habits);
    setSaveError(!ok);
  }, [habits]);

  useEffect(() => {
    const ok = saveLocal(LS_CHECKS, checks);
    setSaveError(!ok);
  }, [checks]);

  const toggleDay = useCallback((habitId, day) => {
    setChecks((prev) => {
      const habitChecks = prev[habitId] || {};
      const monthChecks = habitChecks[mKey] || {};
      const next = { ...monthChecks, [day]: !monthChecks[day] };
      return { ...prev, [habitId]: { ...habitChecks, [mKey]: next } };
    });
  }, [mKey]);

  const percentFor = useCallback((habitId) => {
    const monthChecks = (checks[habitId] || {})[mKey] || {};
    const marked = Object.values(monthChecks).filter(Boolean).length;
    return Math.round((marked / totalDays) * 100);
  }, [checks, mKey, totalDays]);

  const overallPct = useMemo(() => {
    if (habits.length === 0) return 0;
    const sum = habits.reduce((acc, h) => acc + percentFor(h.id), 0);
    return Math.round(sum / habits.length);
  }, [habits, percentFor]);

  const changeMonth = (delta) => {
    let m = monthIndex + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonthIndex(m);
    setYear(y);
  };

  const addHabit = () => {
    const name = newHabitName.trim();
    if (!name) return;
    const palette = ["#FF6B1A", "#2E9BD6", "#FFC83D", "#D32F2F", "#3FA66E", "#7B5BD6"];
    const color = palette[habits.length % palette.length];
    setHabits((prev) => [...prev, { id: uid(), name, color }]);
    setNewHabitName("");
    setAdding(false);
  };

  const deleteHabit = (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    setChecks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setConfirmDelete(null);
    if (focusHabit === id) setFocusHabit(null);
  };

  const isToday = (day) =>
    year === today.getFullYear() && monthIndex === today.getMonth() && day === today.getDate();

  const focusedHabit = habits.find((h) => h.id === focusHabit) || habits[0] || null;
  const focusedPct = focusedHabit ? percentFor(focusedHabit.id) : 0;
  const focusedLvl = nivelPara(focusedPct);

  return (
    <div style={styles.app}>
      <header style={styles.header} className="safe-top">
        <div style={styles.skyDecor}>
          <svg width="100%" height="100%" viewBox="0 0 400 90" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
            <polygon points="0,90 60,40 110,70 170,30 230,68 300,38 360,66 400,50 400,90" fill="#2C5C8A" opacity="0.5" />
            <polygon points="0,90 40,62 90,80 150,55 210,82 270,58 330,80 400,68 400,90" fill="#1F4A73" opacity="0.6" />
          </svg>
          <div className="cloud-drift" style={{ position: "absolute", top: 10, left: 0, display: "flex", gap: 50 }}>
            <CloudShape /><CloudShape /><CloudShape />
          </div>
        </div>
        <div style={styles.headerContent}>
          <div style={styles.brandRow}>
            <DragonBallIcon size={22} />
            <span style={styles.brandText}>Dragon Hábitos</span>
          </div>
          <div style={styles.monthNav}>
            <button className="dbk-btn" style={styles.navBtn} onClick={() => changeMonth(-1)} aria-label="Mes anterior">
              <ChevronLeft size={20} color="#FFF6E0" />
            </button>
            <span style={styles.monthLabel}>{MESES[monthIndex]} {year}</span>
            <button className="dbk-btn" style={styles.navBtn} onClick={() => changeMonth(1)} aria-label="Mes siguiente">
              <ChevronRight size={20} color="#FFF6E0" />
            </button>
          </div>
        </div>
      </header>

      {saveError && (
        <div style={styles.errorBanner}>No se pudo guardar el progreso en este dispositivo.</div>
      )}

      <div style={styles.rankSection}>
        <RankBadge pct={overallPct} size={104} />
        <div style={styles.rankInfo}>
          <div style={styles.rankLabel}>{rangoPara(overallPct).label}</div>
          <div style={styles.rankSub}>Nivel general del mes</div>
          <div style={styles.rankPct}>{overallPct}%</div>
        </div>
      </div>

      {focusedHabit && (
        <div style={styles.powerPanel}>
          <div style={styles.warriorStage}>
            <Warrior pct={focusedPct} size={78} />
          </div>
          <div style={styles.powerInfo}>
            <div style={styles.powerHabitRow}>
              {habits.map((h) => (
                <button
                  key={h.id}
                  className="dbk-btn"
                  onClick={() => setFocusHabit(h.id)}
                  style={{
                    ...styles.powerTab,
                    background: h.id === focusedHabit.id ? "#FFC83D" : "rgba(255,255,255,0.12)",
                    color: h.id === focusedHabit.id ? "#1F2A44" : "#FFF6E0",
                  }}
                >
                  {h.name}
                </button>
              ))}
            </div>
            <div style={styles.powerLevelLabel}>{focusedLvl.label}</div>
            <div style={styles.powerBarTrack}>
              <div
                style={{
                  ...styles.powerBarFill,
                  width: `${focusedPct}%`,
                  background: focusedPct === 100
                    ? "linear-gradient(90deg, #C0C0D8, #FFFFFF)"
                    : `linear-gradient(90deg, ${focusedHabit.color}, ${focusedLvl.aura})`,
                }}
              />
            </div>
            <div style={styles.powerPct}>{focusedPct}% del mes</div>
          </div>
        </div>
      )}

      <div style={styles.scrollWrap} className="dbk-scroll">
        <div style={{ minWidth: 132 + totalDays * 34 + 56 }}>
          <div style={{ display: "flex", marginLeft: 132 }}>
            {weeks.map((w, i) => (
              <div
                key={i}
                style={{
                  width: w.length * 34,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: "#7FA8CC",
                  textTransform: "uppercase",
                  borderRight: i < weeks.length - 1 ? "1px solid #28456B" : "none",
                  paddingBottom: 4,
                }}
              >
                Sem {i + 1}
              </div>
            ))}
            <div style={{ width: 56 }} />
          </div>

          <div style={{ display: "flex", marginLeft: 132, marginBottom: 8 }}>
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
              <div
                key={day}
                style={{
                  width: 34,
                  textAlign: "center",
                  fontSize: 11,
                  fontWeight: isToday(day) ? 800 : 500,
                  color: isToday(day) ? "#FFC83D" : "#8FAFCB",
                }}
              >
                <div>{day}</div>
                <div style={{ fontSize: 9, color: "#5C7C9C" }}>
                  {DIAS_CORTOS[weekdayIndex(year, monthIndex, day)]}
                </div>
              </div>
            ))}
            <div style={{ width: 56, textAlign: "center", fontSize: 10, fontWeight: 800, color: "#8FAFCB" }}>
              %
            </div>
          </div>

          {habits.map((habit) => {
            const pct = percentFor(habit.id);
            return (
              <div key={habit.id} style={styles.row}>
                <div
                  style={{
                    ...styles.habitLabel,
                    outline: habit.id === focusHabit ? `2px solid ${habit.color}` : "none",
                  }}
                  onClick={() => setFocusHabit(habit.id)}
                >
                  <span style={{ ...styles.dot, background: habit.color }} />
                  <span style={styles.habitName}>{habit.name}</span>
                  <button
                    className="dbk-btn"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(habit.id); }}
                    aria-label={`Borrar hábito ${habit.name}`}
                    style={styles.deleteHabitBtn}
                  >
                    <XIcon size={12} color="#5C7C9C" />
                  </button>
                </div>
                {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                  const checked = !!((checks[habit.id] || {})[mKey] || {})[day];
                  return (
                    <button
                      key={day}
                      className="dbk-check"
                      onClick={() => toggleDay(habit.id, day)}
                      aria-pressed={checked}
                      aria-label={`${habit.name}, día ${day}, ${checked ? "marcado" : "sin marcar"}`}
                      style={{
                        width: 34,
                        height: 34,
                        flexShrink: 0,
                        border: "none",
                        borderRadius: 8,
                        background: checked ? habit.color : "#162842",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 120ms ease",
                        margin: "0 1px",
                        boxShadow: checked ? `0 0 8px ${habit.color}99` : "inset 0 0 0 1px #233A5C",
                      }}
                    >
                      {checked && <DragonBallIcon size={16} dots={((day - 1) % 7) + 1} />}
                    </button>
                  );
                })}
                <div style={styles.pctCell}>
                  <span style={{ color: pct === 100 ? "#FFFFFF" : "#E8EEF6", textShadow: pct === 100 ? "0 0 6px #C0C0D8" : "none" }}>
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}

          {habits.length === 0 && (
            <div style={styles.emptyState}>
              Todavía no agregaste hábitos. Tocá "Agregar hábito" y empezá a subir de nivel.
            </div>
          )}
        </div>
      </div>

      <div style={styles.footer} className="safe-bottom">
        {adding ? (
          <div style={styles.addRow}>
            <input
              className="dbk-input"
              autoFocus
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addHabit(); if (e.key === "Escape") setAdding(false); }}
              placeholder="Nombre del hábito"
              style={styles.input}
            />
            <button className="dbk-btn" style={styles.primaryBtn} onClick={addHabit}>Agregar</button>
            <button className="dbk-btn" style={styles.ghostBtn} onClick={() => { setAdding(false); setNewHabitName(""); }} aria-label="Cancelar">
              <XIcon size={18} color="#8FAFCB" />
            </button>
          </div>
        ) : (
          <button className="dbk-btn" style={styles.addBtn} onClick={() => setAdding(true)}>
            <PlusIcon size={18} color="#1F2A44" />
            <span>Agregar hábito</span>
          </button>
        )}
        <div style={styles.hintText}>Tocá la "×" junto a un hábito para borrarlo</div>
      </div>

      {confirmDelete && (
        <div style={styles.modalOverlay} onClick={() => setConfirmDelete(null)}>
          <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <p style={styles.modalText}>
              ¿Borrar "{habits.find((h) => h.id === confirmDelete)?.name}" y todo su historial?
            </p>
            <div style={styles.modalActions}>
              <button className="dbk-btn" style={styles.ghostBtnWide} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="dbk-btn" style={styles.dangerBtn} onClick={() => deleteHabit(confirmDelete)}>
                <TrashIcon size={16} />
                <span>Borrar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: {
    fontFamily: "'Saira', sans-serif",
    background: "#0E1E36",
    minHeight: "100vh",
    color: "#E8EEF6",
    paddingBottom: 110,
  },
  header: {
    position: "sticky",
    top: 0,
    zIndex: 5,
    background: "linear-gradient(180deg, #1F4A73 0%, #16334F 100%)",
    overflow: "hidden",
  },
  skyDecor: { position: "relative", height: 56, overflow: "hidden" },
  headerContent: { padding: "0 16px 14px", position: "relative" },
  brandRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 12, marginTop: -8 },
  brandText: {
    fontFamily: "'Bangers', cursive",
    fontWeight: 400,
    fontSize: 24,
    letterSpacing: "0.02em",
    color: "#FFC83D",
    textShadow: "1px 2px 0 #C2490C",
  },
  monthNav: { display: "flex", alignItems: "center", justifyContent: "space-between" },
  navBtn: {
    background: "rgba(255,255,255,0.12)",
    border: "none",
    borderRadius: 10,
    width: 36,
    height: 36,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  monthLabel: {
    fontFamily: "'Bangers', cursive",
    fontSize: 19,
    letterSpacing: "0.02em",
    color: "#FFF6E0",
    textTransform: "capitalize",
  },
  errorBanner: {
    background: "#5C2424",
    color: "#FFD9D9",
    fontSize: 12,
    padding: "8px 16px",
    textAlign: "center",
  },
  rankSection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "22px 20px",
    margin: "14px 14px 0",
    borderRadius: 22,
    background: "linear-gradient(160deg, #1B2C4D 0%, #0D1830 100%)",
    boxShadow: "0 0 0 1.5px rgba(255,255,255,0.08), 0 10px 30px rgba(0,0,0,0.45), 0 0 36px rgba(120,140,255,0.12)",
    position: "relative",
    zIndex: 3,
  },
  rankInfo: { flex: 1, minWidth: 0 },
  rankLabel: {
    fontFamily: "'Bangers', cursive",
    fontSize: 26,
    letterSpacing: "0.02em",
    color: "#FFF6E0",
    lineHeight: 1.05,
  },
  rankSub: {
    fontSize: 11,
    color: "#8FAFCB",
    fontWeight: 600,
    marginTop: 2,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  rankPct: {
    fontFamily: "'Bangers', cursive",
    fontSize: 22,
    color: "#FFC83D",
  },
  powerPanel: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 16px",
    background: "linear-gradient(180deg, #16334F 0%, #0E1E36 100%)",
    borderBottom: "1px solid #1F4A73",
  },
  warriorStage: {
    flexShrink: 0,
    width: 84,
    height: 130,
    borderRadius: 14,
    background: "radial-gradient(circle at 50% 38%, #1B2C4A 0%, #0A1322 80%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px #233A5C",
    overflow: "hidden",
    padding: 6,
  },
  powerInfo: { flex: 1, minWidth: 0 },
  powerHabitRow: { display: "flex", gap: 6, overflowX: "auto", marginBottom: 8, paddingBottom: 2 },
  powerTab: {
    border: "none",
    borderRadius: 999,
    padding: "5px 12px",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  powerLevelLabel: {
    fontFamily: "'Bangers', cursive",
    fontSize: 16,
    color: "#FFC83D",
    marginBottom: 6,
    letterSpacing: "0.02em",
  },
  powerBarTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    background: "#0A1626",
    overflow: "hidden",
    boxShadow: "inset 0 0 0 1px #233A5C",
  },
  powerBarFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 200ms ease",
  },
  powerPct: { fontSize: 11, color: "#8FAFCB", marginTop: 5, fontWeight: 600 },
  scrollWrap: {
    overflowX: "auto",
    padding: "16px 16px 8px",
  },
  row: {
    display: "flex",
    alignItems: "center",
    marginBottom: 6,
  },
  habitLabel: {
    width: 132,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    gap: 6,
    paddingRight: 6,
    cursor: "pointer",
    borderRadius: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 999, flexShrink: 0 },
  deleteHabitBtn: {
    flexShrink: 0,
    width: 20,
    height: 20,
    borderRadius: 999,
    background: "rgba(255,255,255,0.08)",
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  habitName: {
    fontSize: 13,
    fontWeight: 700,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  pctCell: {
    width: 56,
    flexShrink: 0,
    textAlign: "center",
    fontSize: 13,
    fontWeight: 800,
    fontFamily: "'Bangers', cursive",
  },
  emptyState: {
    padding: "32px 8px",
    textAlign: "center",
    color: "#5C7C9C",
    fontSize: 13,
    lineHeight: 1.6,
  },
  footer: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "12px 16px 8px",
    background: "linear-gradient(to top, #0E1E36 75%, transparent)",
  },
  addBtn: {
    width: "100%",
    background: "#FFC83D",
    color: "#1F2A44",
    border: "none",
    borderRadius: 14,
    padding: "14px 0",
    fontSize: 14,
    fontWeight: 800,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(255,200,61,0.25)",
  },
  hintText: { textAlign: "center", fontSize: 11, color: "#5C7C9C", marginTop: 8 },
  addRow: { display: "flex", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    padding: "13px 14px",
    borderRadius: 12,
    border: "1px solid #2C4A6E",
    fontSize: 14,
    fontFamily: "'Saira', sans-serif",
    background: "#16284A",
    color: "#E8EEF6",
  },
  primaryBtn: {
    background: "#FF6B1A",
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "13px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  ghostBtn: {
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: 12,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(8,16,30,0.7)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 10,
  },
  modalCard: {
    background: "#16284A",
    borderRadius: 16,
    padding: 22,
    maxWidth: 320,
    width: "100%",
    border: "1px solid #2C4A6E",
  },
  modalText: { fontSize: 14, lineHeight: 1.5, marginBottom: 18, color: "#E8EEF6" },
  modalActions: { display: "flex", gap: 8 },
  ghostBtnWide: {
    flex: 1,
    background: "rgba(255,255,255,0.08)",
    border: "none",
    borderRadius: 10,
    padding: "11px 0",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    color: "#E8EEF6",
  },
  dangerBtn: {
    flex: 1,
    background: "#D32F2F",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    padding: "11px 0",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<HabitTracker />);
window.__dbkMounted = true;
if (window.__dbkBootTimeout) clearTimeout(window.__dbkBootTimeout);
