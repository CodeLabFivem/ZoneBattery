// @ts-ignore
const manifest = {"name":"DeckyBatteryHealth","author":"koda-git","flags":["debug","_root"],"api_version":1,"publish":{"tags":["battery","health"],"description":"Decky Battery Health plugin.","image":"https://opengraph.githubassets.com/1/SteamDeckHomebrew/PluginLoader"}};
const API_VERSION = 2;
const internalAPIConnection = window.__DECKY_SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED_deckyLoaderAPIInit;
if (!internalAPIConnection) throw new Error('[@decky/api]: Failed to connect to loader API.');

let api;
try {
    api = internalAPIConnection.connect(API_VERSION, manifest.name);
} catch {
    api = internalAPIConnection.connect(1, manifest.name);
}
const callable            = api.callable;
const addEventListener    = api.addEventListener;
const removeEventListener = api.removeEventListener;
const definePlugin        = (fn) => (...args) => fn(...args);

// ─── icon boilerplate ─────────────────────────────────────────────────────────
var DefaultContext = { color: undefined, size: undefined, className: undefined, style: undefined, attr: undefined };
var IconContext = SP_REACT.createContext && SP_REACT.createContext(DefaultContext);
var _excluded = ["attr", "size", "title"];
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } } return target; }
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == typeof i ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != typeof t || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != typeof i) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function Tree2Element(tree) { return tree && tree.map((node, i) => SP_REACT.createElement(node.tag, _objectSpread({ key: i }, node.attr), Tree2Element(node.child))); }
function GenIcon(data) { return props => SP_REACT.createElement(IconBase, _extends({ attr: _objectSpread({}, data.attr) }, props), Tree2Element(data.child)); }
function IconBase(props) {
    var elem = conf => {
        var { attr, size, title } = props, svgProps = _objectWithoutProperties(props, _excluded);
        var computedSize = size || conf.size || "1em";
        var className;
        if (conf.className) className = conf.className;
        if (props.className) className = (className ? className + " " : "") + props.className;
        return SP_REACT.createElement("svg", _extends({ stroke: "currentColor", fill: "currentColor", strokeWidth: "0" }, conf.attr, attr, svgProps, {
            className, style: _objectSpread(_objectSpread({ color: props.color || conf.color }, conf.style), props.style),
            height: computedSize, width: computedSize, xmlns: "http://www.w3.org/2000/svg"
        }), title && SP_REACT.createElement("title", null, title), props.children);
    };
    return IconContext !== undefined ? SP_REACT.createElement(IconContext.Consumer, null, conf => elem(conf)) : elem(DefaultContext);
}

// Battery icon (outline style, like SteamOS)
function BatteryIcon({ pct, isCharging, size = 28 }) {
    const R = window.SP_REACT;
    const color = isCharging ? "#4fc3f7" : pct > 20 ? "#ffffff" : "#f54242";
    const fillW = Math.round(18 * Math.min(1, Math.max(0, pct / 100)));
    return R.createElement("svg", { width: size, height: size * 0.55, viewBox: "0 0 26 14", fill: "none", xmlns: "http://www.w3.org/2000/svg" },
        // body outline
        R.createElement("rect", { x: 0.5, y: 0.5, width: 22, height: 13, rx: 2, stroke: color, strokeWidth: 1.2 }),
        // terminal nub
        R.createElement("rect", { x: 23, y: 4, width: 2.5, height: 6, rx: 1, fill: color }),
        // fill
        R.createElement("rect", { x: 2, y: 2, width: fillW, height: 10, rx: 1.2, fill: color }),
        // bolt if charging
        isCharging && R.createElement("text", { x: 11, y: 11, textAnchor: "middle", fill: "#1a1a2e", fontSize: "9", fontWeight: "bold" }, "⚡"),
    );
}

// Thin SteamOS-style progress bar
function BatteryBar({ pct, isCharging }) {
    const R = window.SP_REACT;
    const color = isCharging ? "#4fc3f7" : pct > 20 ? "#4fc3f7" : "#f54242";
    return R.createElement("div", { style: { height: "3px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden", margin: "6px 0 0" } },
        R.createElement("div", { style: {
            height: "100%",
            width: `${Math.min(100, Math.max(0, pct))}%`,
            background: color,
            borderRadius: "2px",
            transition: "width 0.6s ease",
        }})
    );
}

// SteamOS-style info row: label on left, value on right
function InfoRow({ label, value, valueColor, subLabel }) {
    const R = window.SP_REACT;
    return R.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", minHeight: "36px" } },
        R.createElement("span", { style: { fontSize: "13px", color: "#c6d4df", fontFamily: "\"Motiva Sans\", sans-serif" } }, label),
        R.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end" } },
            R.createElement("span", { style: { fontSize: "13px", fontWeight: "500", color: valueColor || "#ffffff", fontFamily: "\"Motiva Sans\", sans-serif" } }, value),
            subLabel && R.createElement("span", { style: { fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "1px" } }, subLabel),
        )
    );
}

// Section divider line
function Divider() {
    return window.SP_REACT.createElement("div", { style: { height: "1px", background: "rgba(255,255,255,0.07)", margin: "0 16px" } });
}

// Section header label (like "PERFORMANCE SETTINGS")
function SectionLabel({ text }) {
    return window.SP_REACT.createElement("div", { style: { padding: "12px 16px 4px", fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "\"Motiva Sans\", sans-serif" } }, text);
}

const healthLabel = pct => pct >= 85 ? "Excellent" : pct >= 70 ? "Good" : pct >= 55 ? "Fair" : pct >= 40 ? "Poor" : "Replace Soon";
const healthColor = pct => pct >= 70 ? "#4fc3f7" : pct >= 40 ? "#f5c542" : "#f54242";
const nowTime = () => { const n = new Date(); return `${n.getHours().toString().padStart(2,"0")}:${n.getMinutes().toString().padStart(2,"0")}`; };

// ─── backend ──────────────────────────────────────────────────────────────────
const checkBatteryHealth = callable("get_battery_info");

// ─── main content ─────────────────────────────────────────────────────────────
function Content() {
    const R = window.SP_REACT;
    const [info,    setInfo]    = R.useState(null);
    const [loading, setLoading] = R.useState(false);
    const [error,   setError]   = R.useState(null);

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

    R.useEffect(() => {
        fetchData();
        const t = setInterval(fetchData, 30000);
        return () => clearInterval(t);
    }, []);

    // ── loading ──
    if (loading && !info) {
        return R.createElement(DFL.PanelSection, { title: "Battery" },
            R.createElement(DFL.PanelSectionRow, null,
                R.createElement("div", { style: { color: "rgba(255,255,255,0.35)", fontSize: "13px", textAlign: "center", padding: "24px 0" } }, "Reading battery…")
            )
        );
    }

    // ── error ──
    if (error && !info) {
        return R.createElement(DFL.PanelSection, { title: "Battery" },
            R.createElement(DFL.PanelSectionRow, null,
                R.createElement("div", { style: { color: "#f54242", fontSize: "12px", padding: "8px 0 12px", fontFamily: "monospace" } }, `Error: ${error}`),
                R.createElement(DFL.ButtonItem, { layout: "below", onClick: fetchData }, "Retry")
            )
        );
    }

    if (!info) return null;

    const pct        = parseFloat((info.percentage   ?? 0).toFixed(1));
    const healthPct  = parseFloat((info.batteryHealth ?? 0).toFixed(1));
    const isCharging = info.isCharging ?? false;
    const timeLeft   = info.timeRemaining ?? "N/A";
    const wattage    = info.energyRate ?? 0;
    const voltage    = info.voltage    ?? 0;
    const fullCharge = info.fullCharge ?? 0;
    const designCap  = info.batterySize ?? 0;
    const state      = info.state ?? "unknown";

    // Projected time label — matches SteamOS style
    const timeDisplay = isCharging
        ? (timeLeft === "Charging" ? "Charging" : timeLeft)
        : (timeLeft !== "N/A" ? timeLeft : "—");

    const timeSubLabel = isCharging ? "UNTIL FULL" : "PROJECTED BATTERY LIFE";

    return R.createElement("div", { style: { paddingBottom: "8px" } },

        // ── Hero row: battery icon + % + projected time ──────────────────────
        R.createElement(DFL.PanelSection, { title: "Battery" },
            R.createElement(DFL.PanelSectionRow, null,
                R.createElement("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0 2px" } },

                    // left: icon + percentage
                    R.createElement("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
                        R.createElement(BatteryIcon, { pct, isCharging, size: 32 }),
                        R.createElement("span", { style: { fontSize: "28px", fontWeight: "700", color: "#ffffff", fontFamily: "\"Motiva Sans\", sans-serif", lineHeight: 1 } },
                            `${Math.round(pct)}%`
                        ),
                    ),

                    // right: time + label
                    timeDisplay !== "—" && R.createElement("div", { style: { display: "flex", flexDirection: "column", alignItems: "flex-end" } },
                        R.createElement("span", { style: { fontSize: "16px", fontWeight: "700", color: "#ffffff", fontFamily: "\"Motiva Sans\", sans-serif", lineHeight: 1 } },
                            timeDisplay
                        ),
                        R.createElement("span", { style: { fontSize: "9px", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: "3px" } },
                            timeSubLabel
                        ),
                    ),
                ),

                // battery fill bar
                R.createElement(BatteryBar, { pct, isCharging }),
            )
        ),

        // ── BATTERY SETTINGS section ─────────────────────────────────────────
        R.createElement(SectionLabel, { text: "Battery Settings" }),

        R.createElement("div", { style: { background: "rgba(255,255,255,0.03)", borderRadius: "4px", margin: "0 0 4px" } },

            R.createElement(InfoRow, {
                label: "Battery Health",
                value: `${healthPct}%`,
                valueColor: healthColor(healthPct),
                subLabel: healthLabel(healthPct),
            }),
            R.createElement(Divider),

            R.createElement(InfoRow, {
                label: "State",
                value: state.charAt(0).toUpperCase() + state.slice(1).replace(/-/g, " "),
                valueColor: isCharging ? "#4fc3f7" : "#ffffff",
            }),
            R.createElement(Divider),

            R.createElement(InfoRow, {
                label: "Power Draw",
                value: wattage > 0 ? `${wattage.toFixed(1)} W` : "—",
            }),
            R.createElement(Divider),

            R.createElement(InfoRow, {
                label: "Voltage",
                value: voltage > 0 ? `${voltage.toFixed(2)} V` : "—",
            }),
            R.createElement(Divider),

            R.createElement(InfoRow, {
                label: "Current Capacity",
                value: fullCharge > 0 ? `${fullCharge.toFixed(1)} Wh` : "—",
            }),
            R.createElement(Divider),

            R.createElement(InfoRow, {
                label: "Design Capacity",
                value: designCap > 0 ? `${designCap.toFixed(1)} Wh` : "—",
            }),
        ),
    );
}

// ─── plugin entry ─────────────────────────────────────────────────────────────
var index = definePlugin(() => {
    const listener = addEventListener("timer_event", () => {});

    return {
        name: "Decky Battery Health",
        titleView: window.SP_REACT.createElement("div", { className: DFL.staticClasses.Title }, "Battery"),
        content:   window.SP_REACT.createElement(Content, null),
        icon:      window.SP_REACT.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 26 14", fill: "none", height: "1em", width: "1em" },
            window.SP_REACT.createElement("rect", { x: 0.5, y: 0.5, width: 22, height: 13, rx: 2, stroke: "currentColor", strokeWidth: 1.2 }),
            window.SP_REACT.createElement("rect", { x: 23, y: 4, width: 2.5, height: 6, rx: 1, fill: "currentColor" }),
            window.SP_REACT.createElement("rect", { x: 2, y: 2, width: 14, height: 10, rx: 1.2, fill: "currentColor" }),
        ),
        onDismount() { removeEventListener("timer_event", listener); },
    };
});

export { index as default };
//# sourceMappingURL=index.js.map
