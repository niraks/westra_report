export const statKeys = ["free_throws", "two_pointers", "three_pointers", "fouls"];

export const statLabels = {
  free_throws: "FT/G",
  two_pointers: "2P/G",
  three_pointers: "3P/G",
  fouls: "Fouls/G"
};

// shared per-stat colors so the radar axes, the points-per-game chart, and
// the category leaderboards all use the same color for the same stat
export const statColors = {
  free_throws: "#F59E0B",
  two_pointers: "#3B82F6",
  three_pointers: "#A855F7",
  fouls: "#EF4444"
};

// on the radar, higher = better on every axis; fouls is the one stat where
// more is worse, so that axis is inverted (plotted as 1 - fouls/max) and
// relabeled so it isn't misread as "this player fouls a lot"
export const radarAxisLabels = {...statLabels, fouls: "Discipline"};
export const radarInvertedKeys = new Set(["fouls"]);
