import {
  IconBlankSpot,
  IconFireStation,
  IconLayers,
  IconPin,
  IconRoad,
} from "../Icons";

const layerConfig = [
  {
    key: "damkar",
    label: "Pos Damkar",
    color: "var(--primary)",
    Icon: IconFireStation,
  },
  {
    key: "blankspot",
    label: "Area Blank Spot",
    color: "var(--primary)",
    Icon: IconBlankSpot,
  },
  {
    key: "rekomendasi",
    label: "Rekomendasi Pos Baru",
    color: "var(--accent)",
    Icon: IconPin,
  },
  {
    key: "jalan",
    label: "Jaringan Jalan Raya",
    color: "var(--text-muted)",
    Icon: IconRoad,
  },
];

const LayerControl = ({ layers, onToggle }) => (
  <div className="sidebar-section">
    <div className="sidebar-section-header sidebar-section-header--static">
      <div className="sidebar-section-title-group">
        <span className="section-icon section-icon--gray">
          <IconLayers size={16} />
        </span>
        <span className="sidebar-title-text">Filter Layer</span>
      </div>
    </div>

    <div className="layer-control-list">
      {layerConfig.map(({ key, label, color, Icon }) => (
        <button
          type="button"
          key={key}
          className="control-row"
          onClick={() => onToggle(key)}
          aria-pressed={Boolean(layers[key])}
        >
          <span
            className={`custom-cb cb-${key} ${layers[key] ? "checked" : ""}`}
            aria-hidden="true"
          />
          <span className="control-label">
            <Icon size={15} color={color} />
            <span>{label}</span>
          </span>
        </button>
      ))}
    </div>
  </div>
);

export default LayerControl;
