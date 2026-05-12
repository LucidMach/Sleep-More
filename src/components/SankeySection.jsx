import { useState, useEffect } from "react";
import { Sankey, ResponsiveContainer } from "recharts";

export const formatBucketTime = (hour, use24Hour) => {
  const endHour = (hour + 1) % 24;
  if (use24Hour) {
    return `${hour.toString().padStart(2, "0")}:00 - ${endHour.toString().padStart(2, "0")}:00`;
  }
  const format12 = (h) => {
    if (h === 0) return "12 AM";
    if (h === 12) return "12 PM";
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };
  return `${format12(hour)} - ${format12(endHour)}`;
};

const SankeyNode = (props) => {
  const {
    x,
    y,
    width,
    height,
    payload,
    use24Hour,
    setHoveredNode,
    hoveredNode,
    isMobile,
  } = props;
  const isSleep = payload.type === "Sleep";
  const isHovered = hoveredNode === payload.name;
  const labelOffset = isMobile ? 35 : 70;

  return (
    <g
      onMouseEnter={() => setHoveredNode(payload.name)}
      onMouseLeave={() =>
        setHoveredNode((prev) => (prev === payload.name ? null : prev))
      }
      style={{ cursor: "pointer" }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={payload.fill}
        rx="2"
        fillOpacity={0.9}
        stroke={
          payload.isBestOptimal
            ? isHovered
              ? "#fff"
              : "rgba(255, 255, 255, 0.4)"
            : "none"
        }
        strokeWidth={payload.isBestOptimal ? 2 : 0}
        style={{
          transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          filter: payload.isBestOptimal
            ? isHovered
              ? `drop-shadow(0 0 5px ${payload.fill})`
              : "none"
            : "none",
        }}
      />
      <g
        transform={`translate(${isSleep ? x - labelOffset : x + width + labelOffset}, ${y + height / 2})`}
      >
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill={
            payload.isBestOptimal
              ? "var(--text-primary)"
              : "var(--text-secondary)"
          }
          fontSize={isMobile ? 8 : 11}
          fontWeight={payload.isBestOptimal ? 800 : 700}
          letterSpacing="0.02em"
          style={{ pointerEvents: "none", transition: "all 0.3s ease" }}
        >
          {formatBucketTime(payload.hour, use24Hour)}
        </text>
      </g>
    </g>
  );
};

const SankeyLink = (props) => {
  const {
    sourceX,
    targetX,
    sourceY,
    targetY,
    sourceControlX,
    targetControlX,
    linkWidth,
    payload,
    hoveredNode,
    hoveredLinkId,
    setHoveredLinkId,
    isMobile,
  } = props;

  const isSelfHovered = payload.id && payload.id === hoveredLinkId;
  const isRelated =
    hoveredNode &&
    (payload.source.name === hoveredNode ||
      payload.target.name === hoveredNode);
  const isHighlighted = isSelfHovered || isRelated;

  const color = payload.fill || payload.source?.fill || "#6366F1";

  return (
    <g>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        stroke={color}
        strokeWidth={Math.max(1, linkWidth)}
        fill="none"
        onMouseEnter={() => setHoveredLinkId(payload.id)}
        onMouseLeave={() =>
          setHoveredLinkId((prev) => (prev === payload.id ? null : prev))
        }
        style={{
          transition: "all 0.4s ease",
          cursor: "pointer",
          filter: isHighlighted
            ? "saturate(1.4) brightness(1.2)"
            : "saturate(0.2)",
          opacity: isHighlighted ? 1 : 0.25,
        }}
      />
      {isHighlighted && (
        <g style={{ pointerEvents: "none" }}>
          {/* Background Pill for readability */}
          <rect
            x={(sourceX + targetX) / 2 - (isMobile ? 30 : 40)}
            y={(sourceY + targetY) / 2 - (isMobile ? 10 : 12)}
            width={isMobile ? 60 : 80}
            height={isMobile ? 16 : 18}
            rx={9}
            fill="rgba(15, 23, 42, 0.95)"
            stroke={
              payload.isBestOptimal ? "#f1f1f1" : "rgba(255, 255, 255, 0.15)"
            }
            strokeWidth={payload.isBestOptimal ? 2 : 1}
            style={{ backdropFilter: "blur(4px)" }}
          />
          <text
            x={(sourceX + targetX) / 2}
            y={(sourceY + targetY) / 2 - (isMobile ? 2 : 2)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--text-primary)"
            fontSize={isMobile ? 9 : 11}
            fontWeight={900}
          >
            {payload.originalValue}{" "}
            {isMobile
              ? "sess"
              : payload.originalValue === 1
                ? "session"
                : "sessions"}
          </text>
        </g>
      )}
    </g>
  );
};

const getLinkColor = (durationMins) => {
  const hrs = durationMins / 60;
  if (hrs >= 6 && hrs <= 8) return "#6366F1"; // Indigo
  if (hrs < 6) return "#F43F5E"; // Rose
  return "#F59E0B"; // Amber
};

export const getBucket = (mins) => Math.floor(mins / 60) % 24;

export const processSankeyData = (events, startHour) => {
  if (!events || events.length === 0)
    return { nodes: [], links: [], totalEvents: 0, dynamicHeight: 400 };

  const nodes = [];
  const links = [];
  const nodeMap = new Map();
  const nodeDurations = new Map();
  const uniqueBuckets = new Set();

  events.forEach((event) => {
    uniqueBuckets.add(`Sleep:${getBucket(event.start)}`);
    uniqueBuckets.add(`Wake:${getBucket(event.end)}`);
  });

  const getSortValue = (key) => {
    const hour = parseInt(key.split(":")[1]);
    return (hour - startHour + 24) % 24;
  };

  const sortedNames = Array.from(uniqueBuckets).sort((a, b) => {
    const [typeA] = a.split(":");
    const [typeB] = b.split(":");
    if (typeA !== typeB) return typeA === "Wake" ? 1 : -1;
    return getSortValue(a) - getSortValue(b);
  });

  sortedNames.forEach((key) => {
    const [type, hour] = key.split(":");
    nodeMap.set(key, nodes.length);
    nodes.push({ name: key, type, hour: parseInt(hour) });
  });

  const linkMap = new Map();
  events.forEach((event) => {
    const sleepKey = `Sleep:${getBucket(event.start)}`;
    const wakeKey = `Wake:${getBucket(event.end)}`;
    const source = nodeMap.get(sleepKey);
    const target = nodeMap.get(wakeKey);
    if (source === undefined || target === undefined) return;

    if (!nodeDurations.has(source)) nodeDurations.set(source, []);
    if (!nodeDurations.has(target)) nodeDurations.set(target, []);
    nodeDurations.get(source).push(event.duration);
    nodeDurations.get(target).push(event.duration);

    const key = `${source}-${target}`;
    if (!linkMap.has(key)) {
      linkMap.set(key, {
        source,
        target,
        value: 0,
        durations: [],
        optimalCount: 0,
      });
    }
    const link = linkMap.get(key);
    link.value += 1;
    link.durations.push(event.duration);

    // Count optimal sleep based on bucket duration (visual time in bed)
    const sleepHour = getBucket(event.start);
    const wakeHour = getBucket(event.end);
    const bucketDuration = (wakeHour - sleepHour + 24) % 24;
    if (bucketDuration >= 6 && bucketDuration <= 8) {
      link.optimalCount += 1;
    }
  });

  let bestOptimalLinkKey = null;
  let maxOptimalCount = 0;
  for (const [key, link] of linkMap.entries()) {
    if (link.optimalCount > maxOptimalCount) {
      maxOptimalCount = link.optimalCount;
      bestOptimalLinkKey = key;
    } else if (link.optimalCount === maxOptimalCount && maxOptimalCount > 0) {
      // Tie-breaker: use total value
      if (link.value > linkMap.get(bestOptimalLinkKey).value) {
        bestOptimalLinkKey = key;
      }
    }
  }

  for (const [key, link] of linkMap.entries()) {
    const avgDuration =
      link.durations.reduce((a, b) => a + b, 0) / link.durations.length;
    links.push({
      id: Math.random().toString(36).substr(2, 9),
      source: link.source,
      target: link.target,
      value: link.value + 0.3,
      originalValue: link.value,
      fill: getLinkColor(avgDuration),
      avgDuration,
      isBestOptimal: key === bestOptimalLinkKey && maxOptimalCount > 0,
    });
  }

  // Sort links by source and target node indices to ensure they follow chronological order
  links.sort((a, b) => {
    if (a.source !== b.source) return a.source - b.source;
    return a.target - b.target;
  });

  nodes.forEach((node, i) => {
    const connectedLinks = links.filter(
      (l) => l.source === i || l.target === i,
    );
    let dominantLink = null;
    let maxVal = -1;
    connectedLinks.forEach((l) => {
      if (l.value > maxVal) {
        maxVal = l.value;
        dominantLink = l;
      }
    });

    // Mark if part of the best optimal flow
    const isPartOfBest = links.some(
      (l) => l.isBestOptimal && (l.source === i || l.target === i),
    );
    node.isBestOptimal = isPartOfBest;

    if (dominantLink) {
      node.fill = dominantLink.fill;
      node.avgDuration = dominantLink.avgDuration;
    } else {
      const durations = nodeDurations.get(i) || [];
      const avgDuration =
        durations.reduce((a, b) => a + b, 0) / (durations.length || 1);
      node.fill = getLinkColor(avgDuration);
      node.avgDuration = avgDuration;
    }
  });

  const totalEvents = links.reduce((sum, l) => sum + l.originalValue, 0);
  const totalBoostedValue = links.reduce((sum, l) => sum + l.value, 0);
  const sleepNodesCount = nodes.filter((n) => n.type === "Sleep").length;
  const wakeNodesCount = nodes.filter((n) => n.type === "Wake").length;

  const minNodeHeight = 13;
  const padding = 14;
  const vMin = 1.3;
  const dynamicHeight = Math.max(
    400,
    Math.min(
      800,
      (minNodeHeight * totalBoostedValue) / vMin +
        Math.max(sleepNodesCount, wakeNodesCount) * padding +
        100,
    ),
  );

  return { nodes, links, totalEvents, dynamicHeight };
};

const SankeySection = ({ title, icon: Icon, data, use24Hour }) => {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredLinkId, setHoveredLinkId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!data || !data.links || !data.links.length) return null;

  const sideMargin = isMobile ? 60 : 140;

  return (
    <div className="card chart-card" style={{ marginBottom: "2rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            <Icon size={20} /> {title}
          </h2>
          <div
            style={{
              marginLeft: "1.8rem",
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              opacity: 0.7,
              marginTop: "0.3rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {data.totalEvents} historical sessions
          </div>
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: isMobile ? 550 : data.dynamicHeight,
          position: "relative",
        }}
        onMouseLeave={() => {
          setHoveredNode(null);
          setHoveredLinkId(null);
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "space-between",
            fontSize: isMobile ? "0.6rem" : "0.7rem",
            fontWeight: 800,
            letterSpacing: "0.1em",
            color: "var(--text-secondary)",
            opacity: 0.8,
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          <div style={{ width: sideMargin, textAlign: "center" }}>
            Bed{isMobile ? "" : "time"}
          </div>
          <div style={{ width: sideMargin, textAlign: "center" }}>
            Wake{isMobile ? "" : " Up"}
          </div>
        </div>
        <ResponsiveContainer>
          <Sankey
            data={data}
            node={
              <SankeyNode
                use24Hour={use24Hour}
                setHoveredNode={setHoveredNode}
                hoveredNode={hoveredNode}
                isMobile={isMobile}
              />
            }
            link={
              <SankeyLink
                hoveredNode={hoveredNode}
                hoveredLinkId={hoveredLinkId}
                setHoveredLinkId={setHoveredLinkId}
                isMobile={isMobile}
              />
            }
            margin={{
              top: 25,
              right: sideMargin,
              bottom: 20,
              left: sideMargin,
            }}
            nodeWidth={14}
            nodePadding={isMobile ? 10 : 14}
            iterations={0}
          />
        </ResponsiveContainer>
      </div>

      <div className="legend-container">
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "2px",
              background: "#F43F5E",
              boxShadow: "0 0 10px rgba(244, 63, 94, 0.3)",
            }}
          />
          <span>Insufficient</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "2px",
              background: "#6366F1",
              boxShadow: "0 0 10px rgba(99, 102, 241, 0.3)",
            }}
          />
          <span>Optimal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "2px",
              background: "#F59E0B",
              boxShadow: "0 0 10px rgba(245, 158, 11, 0.3)",
            }}
          />
          <span>Excessive</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "2px",
              background: "#1A1A1A",
              border: "2px solid #f1f1f1",
            }}
          />
          <span>GOLDEN ROUTINE</span>
        </div>
      </div>
      <br />
      <p
        style={{
          textAlign: "center",
          fontSize: "0.7rem",
          color: "var(--text-secondary)",
          opacity: 0.7,
        }}
      >
        <span style={{ fontWeight: "bold" }}>Golden Routine:</span> The most
        frequent routine where you sleep within optimal range.
      </p>
    </div>
  );
};

export default SankeySection;
