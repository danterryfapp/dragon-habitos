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
  if (pct === 0) return { key: "bebe", label: "Recién nacido", aura: "#BFE3F2" };
  if (pct < 40) return { key: "base", label: "Entrenando", aura: "#E2D9C9" };
  if (pct < 70) return { key: "ssj", label: "Super nivel 1", aura: "#FFD23F" };
  if (pct < 100) return { key: "ssjblue", label: "Super nivel 2", aura: "#4FC3F7" };
  return { key: "ultra", label: "Instinto superior", aura: "#E8E8F0" };
}

// Trazos de silueta genéricos: proporciones de cría (cabeza grande + colita) vs.
// guerrero adulto de pie en pose firme. Formas propias, no el contorno de un personaje existente.
const BABY_SILHOUETTE =
  "M50 18 C62 18 70 27 70 40 C70 47 67 52 62 56 C68 60 72 67 72 76 L72 95 C72 102 66 108 58 108 L42 108 C34 108 28 102 28 95 L28 76 C28 67 32 60 38 56 C33 52 30 47 30 40 C30 27 38 18 50 18 Z M68 92 C74 92 80 97 80 104 C80 109 76 112 72 110 C70 109 69 106 70 103 C68 104 66 102 67 99 C67 96 68 93 68 92 Z";

const ADULT_SILHOUETTE =
  "M50 8 C59 8 66 15 66 25 C66 31 63 36 59 39 L60 44 C68 46 74 53 76 62 L80 78 C81 83 78 87 73 87 C70 87 68 85 67 82 L63 68 L64 100 C64 105 67 108 70 110 L70 116 L56 116 L55 90 L50 90 L45 90 L44 116 L30 116 L30 110 C33 108 36 105 36 100 L37 68 L33 82 C32 85 30 87 27 87 C22 87 19 83 20 78 L24 62 C26 53 32 46 40 44 L41 39 C37 36 34 31 34 25 C34 15 41 8 50 8 Z";

// ---------- Figura del guerrero: silueta tipo sombra (anime), no calca ningún personaje ----------
function Warrior({ pct, size = 96 }) {
  const lvl = nivelPara(pct);
  const isBebe = lvl.key === "bebe";
  const isUltra = lvl.key === "ultra";
  const isSsjBlue = lvl.key === "ssjblue";
  const isSsj = lvl.key === "ssj";
  const energized = isSsj || isSsjBlue || isUltra;
  const siluetaColor = "#0B0E16";

  return (
    <div style={{ position: "relative", width: size, height: size * 1.15 }}>
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
      <svg viewBox="0 0 100 116" width={size} height={size * 1.16} style={{ position: "absolute", inset: 0, zIndex: 1 }}>
        {isBebe ? (
          <path d={BABY_SILHOUETTE} fill="none" stroke={lvl.aura} strokeWidth="2.6" opacity="0.9" transform="scale(1.035) translate(-1.7 -2)" />
        ) : (
          <path
            d={ADULT_SILHOUETTE}
            fill="none"
            stroke={lvl.aura}
            strokeWidth={isUltra ? 2.8 : 2.4}
            opacity={pct > 0 ? 0.95 : 0}
            transform="scale(1.03) translate(-1.5 -1.7)"
          />
        )}
      </svg>
      <svg viewBox="0 0 100 116" width={size} height={size * 1.16} style={{ position: "relative", zIndex: 2 }}>
        <path d={isBebe ? BABY_SILHOUETTE : ADULT_SILHOUETTE} fill={siluetaColor} />
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
    height: 94,
    borderRadius: 14,
    background: "radial-gradient(circle at 50% 38%, #1B2C4A 0%, #0A1322 80%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "inset 0 0 0 1px #233A5C",
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
