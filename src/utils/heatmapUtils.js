export const getBaseColor = (hrs) => {
  let r, g, b;
  if (hrs >= 6 && hrs <= 8) {
    r = 67;
    g = 56;
    b = 202;
  } else if (hrs < 6) {
    const ratio = Math.min(1, hrs / 6);
    r = Math.round(255 + (245 - 255) * ratio);
    g = Math.round(45 + (158 - 45) * ratio);
    b = Math.round(45 + (11 - 45) * ratio);
  } else {
    const ratio = Math.min(1, (hrs - 8) / 4);
    r = Math.round(245 + (255 - 245) * ratio);
    g = Math.round(158 + (45 - 158) * ratio);
    b = Math.round(11 + (45 - 11) * ratio);
  }
  return [r, g, b];
};

export const getRecoveryColor = (normalized) => {
  let r, g, b;
  if (normalized < 0.5) {
    const sub = normalized * 2;
    r = 255;
    g = Math.round(0 + 210 * sub);
    b = 0;
  } else {
    const sub = (normalized - 0.5) * 2;
    r = Math.round(255 - 230 * sub);
    g = Math.round(210 + 10 * sub);
    b = Math.round(0 + 110 * sub);
  }
  return [r, g, b];
};

export const getQualityColor = (normalized) => {
  const r = Math.round(245 + (67 - 245) * normalized);
  const g = Math.round(50 + (56 - 50) * normalized);
  const b = Math.round(50 + (202 - 50) * normalized);
  return [r, g, b];
};

export const getCellColor = (d, metric) => {
  if (!d)
    return {
      background: "rgba(255,255,255,0.03)",
      border: "none",
      boxShadow: "none",
    };

  let r, g, b, intensity, opacity;

  if (metric === "quality") {
    const score = d.sleep_quality_score || 0;
    const normalized = Math.max(0, Math.min(1, score / 100));
    [r, g, b] = getQualityColor(normalized);
    intensity = normalized;
    opacity = Math.max(0.85, intensity);
  } else if (metric === "recovery") {
    const ratio = parseFloat(d.recovery_ratio) || 0;
    const normalized = Math.max(0, Math.min(1, (ratio - 0.7) / 0.8));
    [r, g, b] = getRecoveryColor(normalized);
    intensity = normalized;
    opacity = Math.max(0.92, intensity);
  } else {
    const hrs = (d.mins_asleep || 0) / 60;
    [r, g, b] = getBaseColor(hrs);
    
    if (hrs >= 6 && hrs <= 8) {
      intensity = 0.9;
    } else if (hrs < 6) {
      intensity = Math.max(0.3, hrs / 6);
    } else {
      intensity = Math.max(0.3, 1 - (hrs - 8) / 4);
    }
    
    opacity = Math.max(0.7, intensity);
  }

  const baseSaturation = metric === "quantity" ? 75 : metric === "quality" ? 75 : 90;
  const saturationRange = metric === "quantity" ? 75 : metric === "quality" ? 20 : 10;
  const saturation = baseSaturation + intensity * saturationRange;
  const filter = `saturate(${saturation}%)`;
  let borderColor = "none";
  let boxShadow = "none";

  const hrs = (d.mins_asleep || 0) / 60;
  if (intensity > 0.85) {
    borderColor = `rgba(${r}, ${g}, ${b}, 0.8)`;
    boxShadow = `0 0 8px rgba(${r}, ${g}, ${b}, 0.4)`;
  } else if (hrs < 6 && hrs > 0) {
    boxShadow =
      "inset 1.5px 1.5px 2px rgba(0,0,0,0.5), inset -0.5px -0.5px 1px rgba(255,255,255,0.1)";
  } else if (hrs > 8) {
    boxShadow =
      "inset 1.5px 1.5px 1px rgba(255,255,255,0.3), inset -1.5px -1.5px 1px rgba(0,0,0,0.4), 1px 1px 2px rgba(0,0,0,0.4)";
  }

  return {
    background: `rgba(${r}, ${g}, ${b}, ${opacity})`,
    border:
      borderColor !== "none"
        ? `1px solid ${borderColor}`
        : "1px solid rgba(255,255,255,0.03)",
    boxShadow,
    filter,
  };
};
