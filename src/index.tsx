import { PanelSection, PanelSectionRow, ButtonItem, staticClasses } from "@decky/ui";
import { addEventListener, removeEventListener, callable, definePlugin } from "@decky/api";
import { useState, useEffect, FC } from "react";

// ─── types ────────────────────────────────────────────────────────────────────
interface BatteryInfo {
  fullCharge:    number;
  batterySize:   number;
  energyNow:     number;
  percentage:    number;
  state:         string;
  voltage:       number;
  energyRate:    number;
  timeRemaining: string;
  isCharging:    boolean;
  batteryHealth: number;
  batteryPath:   string;
  error?:        string;
}

// ─── backend ──────────────────────────────────────────────────────────────────
const checkBatteryHealth = callable<[], BatteryInfo>("get_battery_info");

// ─── helpers ──────────────────────────────────────────────────────────────────
const healthLabel = (pct: number) =>
  pct >= 85 ? "Excellent" : pct >= 70 ? "Good" : pct >= 55 ? "Fair" : pct >= 40 ? "Poor" : "Replace Soon";

const healthColor = (pct: number) =>
  pct >= 70 ? "#4fc3f7" : pct >= 40 ? "#f5c542" : "#f54242";

// ─── BatteryIcon ──────────────────────────────────────────────────────────────
const BatteryIcon: FC<{ pct: number; isCharging: boolean; size?: number }> = ({ pct, isCharging, size = 32 }) => {
  const color  = isCharging ? "#4fc3f7" : pct > 20 ? "#ffffff" : "#f54242";
  const fillW  = Math.round(18 * Math.min(1, Math.max(0, pct / 100)));
  const height = size * 0.55;
  return (
    <svg width={size} height={height} viewBox="0 0 26 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="22" height="13" rx="2" stroke={color} strokeWidth="1.2" />
      <rect x="23"  y="4"   width="2.5" height="6" rx="1" fill={color} />
      <rect x="2"   y="2"   width={fillW} height="10" rx="1.2" fill={color} />
      {isCharging && <text x="11" y="11" textAnchor="middle" fill="#1a1a2e" fontSize="9" fontWeight="bold">⚡</text>}
    </svg>
  );
};

// ─── BatteryBar ───────────────────────────────────────────────────────────────
const BatteryBar: FC<{ pct: number; isCharging: boolean }> = ({ pct, isCharging }) => {
  const color = isCharging ? "#4fc3f7" : pct > 20 ? "#4fc3f7" : "#f54242";
  return (
    <div style={{ height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden", margin: "6px 0 0" }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, pct))}%`,
        background: color,
        borderRadius: "2px",
        transition: "width 0.6s ease",
      }} />
    </div>
  );
};

// ─── InfoRow ──────────────────────────────────────────────────────────────────
const InfoRow: FC<{ label: string; value: string; valueColor?: string; subLabel?: string }> = ({ label, value, valueColor, subLabel }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", minHeight: "36px" }}>
    <span style={{ fontSize: "13px", color: "#c6d4df", fontFamily: '"Motiva Sans", sans-serif' }}>{label}</span>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <span style={{ fontSize: "13px", fontWeight: 500, color: valueColor ?? "#ffffff", fontFamily: '"Motiva Sans", sans-serif' }}>{value}</span>
      {subLabel && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "1px" }}>{subLabel}</span>}
    </div>
  </div>
);

// ─── Divider ──────────────────────────────────────────────────────────────────
const Divider: FC = () => (
  <div style={{ height: "1px", background: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
);

// ─── SectionLabel ─────────────────────────────────────────────────────────────
const SectionLabel: FC<{ text: string }> = ({ text }) => (
  <div style={{ padding: "12px 16px 4px", fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: '"Motiva Sans", sans-serif' }}>
    {text}
  </div>
);

// ─── Content ──────────────────────────────────────────────────────────────────
function Content() {
  const [info,    setInfo]    = useState<BatteryInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await checkBatteryHealth();
      if (res?.error && res.fullCharge === 0) setError(res.error);
      else setInfo(res);
    } catch {
      setError("Backend unreachable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30000);
    return () => clearInterval(t);
  }, []);

  if (loading && !info) {
    return (
      <PanelSection title="Battery">
        <PanelSectionRow>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "13px", textAlign: "center", padding: "24px 0" }}>
            Reading battery…
          </div>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  if (error && !info) {
    return (
      <PanelSection title="Battery">
        <PanelSectionRow>
          <div style={{ color: "#f54242", fontSize: "12px", padding: "8px 0 12px", fontFamily: "monospace" }}>
            Error: {error}
          </div>
          <ButtonItem layout="below" onClick={fetchData}>Retry</ButtonItem>
        </PanelSectionRow>
      </PanelSection>
    );
  }

  if (!info) return null;

  const pct         = parseFloat((info.percentage   ?? 0).toFixed(1));
  const healthPct   = parseFloat((info.batteryHealth ?? 0).toFixed(1));
  const isCharging  = info.isCharging ?? false;
  const timeLeft    = info.timeRemaining ?? "N/A";
  const wattage     = info.energyRate ?? 0;
  const voltage     = info.voltage    ?? 0;
  const fullCharge  = info.fullCharge ?? 0;
  const designCap   = info.batterySize ?? 0;
  const state       = info.state ?? "unknown";

  const timeDisplay  = isCharging ? (timeLeft === "Charging" ? "Charging" : timeLeft) : (timeLeft !== "N/A" ? timeLeft : "—");
  const timeSubLabel = isCharging ? "UNTIL FULL" : "PROJECTED BATTERY LIFE";

  return (
    <div style={{ paddingBottom: "8px" }}>

      {/* ── Hero: icon + % + projected time ── */}
      <PanelSection title="Battery">
        <PanelSectionRow>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0 2px" }}>

            {/* left: icon + percentage */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <BatteryIcon pct={pct} isCharging={isCharging} size={32} />
              <span style={{ fontSize: "28px", fontWeight: 700, color: "#ffffff", fontFamily: '"Motiva Sans", sans-serif', lineHeight: 1 }}>
                {Math.round(pct)}%
              </span>
            </div>

            {/* right: time + sublabel */}
            {timeDisplay !== "—" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#ffffff", fontFamily: '"Motiva Sans", sans-serif', lineHeight: 1 }}>
                  {timeDisplay}
                </span>
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "3px" }}>
                  {timeSubLabel}
                </span>
              </div>
            )}
          </div>

          {/* fill bar */}
          <BatteryBar pct={pct} isCharging={isCharging} />
        </PanelSectionRow>
      </PanelSection>

      {/* ── BATTERY SETTINGS section ── */}
      <SectionLabel text="Battery Settings" />

      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "4px", margin: "0 0 4px" }}>
        <InfoRow label="Battery Health"    value={`${healthPct}%`}                                              valueColor={healthColor(healthPct)} subLabel={healthLabel(healthPct)} />
        <Divider />
        <InfoRow label="State"             value={state.charAt(0).toUpperCase() + state.slice(1).replace(/-/g, " ")} valueColor={isCharging ? "#4fc3f7" : "#ffffff"} />
        <Divider />
        <InfoRow label="Power Draw"        value={wattage   > 0 ? `${wattage.toFixed(1)} W`    : "—"} />
        <Divider />
        <InfoRow label="Voltage"           value={voltage   > 0 ? `${voltage.toFixed(2)} V`    : "—"} />
        <Divider />
        <InfoRow label="Current Capacity"  value={fullCharge > 0 ? `${fullCharge.toFixed(1)} Wh` : "—"} />
        <Divider />
        <InfoRow label="Design Capacity"   value={designCap  > 0 ? `${designCap.toFixed(1)} Wh`  : "—"} />
      </div>

    </div>
  );
}

// ─── plugin entry ─────────────────────────────────────────────────────────────
export default definePlugin(() => {
  const listener = addEventListener("timer_event", () => {});

  return {
    name: "Decky Battery Health",
    titleView: <div className={staticClasses.Title}>Battery</div>,
    content:   <Content />,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 14" fill="none" height="1em" width="1em">
        <rect x="0.5" y="0.5" width="22" height="13" rx="2" stroke="currentColor" strokeWidth="1.2" />
        <rect x="23"  y="4"   width="2.5" height="6" rx="1" fill="currentColor" />
        <rect x="2"   y="2"   width="14"  height="10" rx="1.2" fill="currentColor" />
      </svg>
    ),
    onDismount() {
      removeEventListener("timer_event", listener);
    },
  };
});
