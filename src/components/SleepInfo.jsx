import { Info } from "lucide-react";

const SleepInfo = () => (
  <div
    className="card"
    style={{
      background: "#1e293b",
      border: "1px solid rgba(255,255,255,0.1)",
      padding: "2rem",
      color: "var(--text-primary)",
    }}
  >
    <h3
      style={{
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <Info size={20} className="text-accent" />
      Sleep Quality & Recovery Guide
    </h3>
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        fontSize: "0.9rem",
        lineHeight: "1.6",
      }}
    >
      <p>
        Toggle between <strong>Quality</strong>, <strong>Recovery</strong> and{" "}
        <strong>Quantity</strong> to visualize different aspects of your sleep
        health.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginTop: "0.5rem",
        }}
      >
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
            <div
              style={{
                fontWeight: 700,
                color: "#ef4444", // Rose/Red start
                marginBottom: "0.25rem",
                background: "linear-gradient(to right, #ef4444, #4338ca)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              SLEEP QUALITY
            </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            A color scale from <strong>Red (Low)</strong> to{" "}
            <strong>Purple (High)</strong> based on sleep architecture (REM and
            Deep sleep ratios).
          </p>
        </div>
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "var(--success)",
              marginBottom: "0.25rem",
            }}
          >
            RECOVERY RATIO
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Ratio of HRV during sleep vs awake. A higher ratio indicates better
            autonomic recovery. Low HRV implies high stress or fatigue.
          </p>
        </div>
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "#a855f7", // Purple
              marginBottom: "0.25rem",
            }}
          >
            SLEEP QUANTITY
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Total duration of sleep in hours. Colors match the quantity bar:
            Red (Insufficient/Excessive), Orange (Borderline), Purple (Optimal).
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "var(--deep)",
              marginBottom: "0.25rem",
            }}
          >
            DEEP SLEEP
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Physical recovery, tissue growth, and immune system repair.
          </p>
        </div>
        <div
          style={{
            padding: "1rem",
            background: "rgba(255,255,255,0.03)",
            borderRadius: "0.75rem",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              color: "var(--rem)",
              marginBottom: "0.25rem",
            }}
          >
            REM SLEEP
          </div>
          <p style={{ fontSize: "0.8rem", opacity: 0.8 }}>
            Cognitive recovery, memory consolidation, and emotional processing.
          </p>
        </div>
      </div>
      <p
        style={{
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          fontStyle: "italic",
          marginTop: "0.5rem",
        }}
      >
        * Aim for 6-8 hours of total sleep. Durations outside this range are
        marked with distinct cell textures (Indent/Bevel).
      </p>
    </div>
  </div>
);

export default SleepInfo;
