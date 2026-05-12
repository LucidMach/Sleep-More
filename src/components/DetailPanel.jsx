const DetailPanel = ({
  display,
  total,
  hrs,
  isOptimal,
  isCritical,
  barWidth,
  stages,
  durationColor,
  recoveryColor,
  qualityColor,
}) => {
  const recoveryDelta = Math.abs(
    Math.round((display.recovery_ratio - 1) * 100),
  );
  const isPositive = display.recovery_ratio >= 1;

  return (
    <div className="detail-panel-container">
      {/* Date Label */}
      <div
        style={{
          fontSize: "0.65rem",
          fontWeight: 900,
          letterSpacing: "0.15em",
          color: "var(--accent-color)",
          marginBottom: "1.25rem",
          textTransform: "uppercase",
          opacity: 0.8,
        }}
      >
        {display.label}
      </div>

      {/* Primary Metrics Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <div className="stat-label" style={{ fontSize: "0.6rem" }}>
            DURATION
          </div>
          <div
            className="stat-value"
            style={{ fontSize: "1.6rem", color: durationColor }}
          >
            {display.mins_asleep
              ? `${Math.floor(display.mins_asleep / 60)}h ${display.mins_asleep % 60}m`
              : "-"}
          </div>
        </div>
        <div>
          <div className="stat-label" style={{ fontSize: "0.6rem" }}>
            RECOVERY
          </div>
          <div
            className="stat-value"
            style={{ fontSize: "1.6rem", color: recoveryColor }}
          >
            {display.mins_asleep ? display.recovery_ratio + "x" : "-"}
          </div>
        </div>
      </div>

      {/* HRV Metrics Section */}
      <div>
        <div
          className="stat-label"
          style={{ marginBottom: "1rem", fontSize: "0.65rem" }}
        >
          AUTONOMIC RECOVERY (HRV)
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.65rem",
                color: "var(--text-secondary)",
                marginBottom: "0.3rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <span>Asleep</span>
              <span style={{ color: "var(--text-primary)" }}>
                {display.hrv_asleep_avg} ms
              </span>
            </div>
            <div
              style={{
                height: 8,
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${display.mins_asleep ? Math.min(100, (display.hrv_asleep_avg / 150) * 100) : 0}%`,
                  background: recoveryColor,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>

          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.65rem",
                color: "var(--text-secondary)",
                marginBottom: "0.3rem",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              <span>Awake</span>
              <span style={{ color: "var(--text-primary)" }}>
                {display.hrv_awake_avg} ms
              </span>
            </div>
            <div
              style={{
                height: 8,
                width: "100%",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${display.mins_asleep ? Math.min(100, (display.hrv_awake_avg / 150) * 100) : 0}%`,
                  background: "var(--text-secondary)",
                  opacity: 0.5,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        </div>
        <p
          style={{
            fontSize: "0.6rem",
            color: "var(--text-secondary)",
            marginTop: "1.25rem",
            fontStyle: "italic",
            lineHeight: "1.4",
            opacity: 0.8,
          }}
        >
          * Low HRV implies high physical or mental stress, fatigue, or
          incomplete recovery.
        </p>

        <div
          style={{
            height: "1px",
            background: "var(--card-border)",
            margin: "1.5rem 0",
          }}
        />
      </div>

      {/* Quality Score Section */}
      <div>
        <div
          className="stat-label"
          style={{
            marginBottom: "0.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span>SLEEP BREAKDOWN</span>
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: 800,
              color: qualityColor || "var(--text-primary)",
            }}
          >
            {display.sleep_quality_score}%
          </span>
        </div>

        {/* Breakdown Bar */}
        <div
          style={{
            height: 24,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 2,
            overflow: "hidden",
            display: "flex",
            marginBottom: "1rem",
          }}
        >
          {stages.map((stage, i) => (
            <div
              key={i}
              style={{
                height: "100%",
                width: `${(stage.mins / (display.mins_asleep + display.mins_awake || 1)) * 100}%`,
                background: stage.color,
                transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
              }}
              title={`${stage.label}: ${stage.mins}m`}
            />
          ))}
        </div>

        {/* Breakdown List - Compact 2-column grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.4rem 1rem",
          }}
        >
          {stages.map((stage, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.65rem",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "1px",
                    background: stage.color,
                  }}
                />
                <span
                  style={{ color: "var(--text-secondary)", fontWeight: 500 }}
                >
                  {stage.label}
                </span>
              </div>
              <span style={{ fontWeight: 700, opacity: 0.9 }}>
                {stage.mins
                  ? `${Math.floor(stage.mins / 60)}h${stage.mins % 60}m`
                  : "0h0m"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailPanel;
