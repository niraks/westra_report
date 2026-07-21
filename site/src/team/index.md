<style>
main {
  max-width: 720px;
}
main svg {
  max-width: 100%;
  height: auto;
}
.page-subheading {
  margin-top: -0.75rem;
  margin-bottom: 1.5rem;
  opacity: 0.65;
  font-size: 1rem;
}

/* tighten the gap around the season/team profile: summary table and the
   radar chart svg directly below it */
main div.observablehq--block:has(> form[class*="-table"]),
main div.observablehq--block:has(> svg) {
  margin: 0.25rem 0;
}

/* sibling nav (other teams / other players): floats beside the main
   column instead of pushing it aside, so it only shows once there's
   comfortably enough width for it not to overlap the centered content */
.sibling-nav {
  display: none;
}
@media (min-width: 1300px) {
  .sibling-nav {
    display: block;
    position: fixed;
    top: 100px;
    right: 2rem;
    width: 200px;
    max-height: 70vh;
    overflow-y: auto;
    font-size: 0.85rem;
  }
}
.sibling-nav-heading {
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  opacity: 0.6;
  margin-bottom: 0.5rem;
}
.sibling-nav ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
.sibling-nav li {
  margin-bottom: 0.35rem;
  line-height: 1.3;
}
.sibling-nav a.current {
  font-weight: 600;
  color: currentColor;
  text-decoration: none;
}

/* mobile equivalent: a native <details> disclosure inline in the content
   flow, collapsed by default — shown only where the fixed sidebar (above)
   doesn't fit */
.sibling-nav-mobile {
  display: block;
  margin: 1rem 0;
  border: 1px solid color-mix(in srgb, currentColor 15%, transparent);
  border-radius: 6px;
  padding: 0 0.75rem;
}
@media (min-width: 1300px) {
  .sibling-nav-mobile {
    display: none;
  }
}
.sibling-nav-mobile summary {
  cursor: pointer;
  font-weight: 600;
  padding: 0.6rem 0;
  list-style: none;
}
.sibling-nav-mobile summary::-webkit-details-marker {
  display: none;
}
.sibling-nav-mobile summary::after {
  content: "▾";
  float: right;
  opacity: 0.6;
}
.sibling-nav-mobile[open] summary::after {
  content: "▴";
}
.sibling-nav-mobile ul {
  list-style: none;
  margin: 0;
  padding: 0 0 0.5rem;
}
.sibling-nav-mobile li {
  padding: 0.5rem 0;
  border-top: 1px solid color-mix(in srgb, currentColor 10%, transparent);
}
.sibling-nav-mobile a.current {
  font-weight: 600;
  color: currentColor;
  text-decoration: none;
}
</style>

```js
const games = FileAttachment("../data/games.json").json();
```

```js
// this page is only ever reached via a generated link (sunburst, /teams/,
// /players/, /categories/) that already supplies the full season/category/
// team(/player) context.
const params = new URLSearchParams(location.search);
const season = params.get("season") ?? "";
const category = params.get("category") ?? "";
const team = params.get("team") ?? "";
const player = params.get("player") ?? "";
```

```js
import {
  statKeys,
  statLabels,
  statColors,
  radarAxisLabels,
  radarInvertedKeys
} from "../lib/stats.js";
```

```js
// azimuthal-equidistant radar: one or more named series (e.g. "Category" vs
// "Team" scope) overlaid as translucent areas, colored by series rather than
// by axis — hover isolates one series, matching the reference d3/Plot radar
// chart pattern. Axis LABELS still carry the per-stat color (statColors) so
// they stay visually tied to the same stat coloring used in the bar chart.
function radarPlot(series, {size = 480} = {}) {
  const axisNames = series[0]?.values.map((v) => v.axis) ?? [];
  const n = axisNames.length;

  function longitude(axis) {
    return (360 * axisNames.indexOf(axis)) / n;
  }
  longitude.domain = () => axisNames;

  const rings = [0.2, 0.4, 0.6, 0.8, 1];
  const labelRadius = 1.14;
  const domain = d3.geoCircle().center([0, 90]).radius(1.22)();

  const axisColorByLabel = Object.fromEntries(
    statKeys.map((k) => [radarAxisLabels[k], statColors[k]])
  );

  // draw emphasized series (e.g. "Category") last so its outline/fill sits
  // on top of the others, rather than getting buried underneath them
  const paintOrder = [...series].sort((a, b) => (a.emphasis ? 1 : 0) - (b.emphasis ? 1 : 0));
  const points = paintOrder.flatMap((s) =>
    s.values.map((v) => ({
      series: s.name,
      key: v.axis,
      ratio: v.ratio,
      rawLabel: v.rawLabel,
      rawValue: v.rawValue,
      emphasis: !!s.emphasis
    }))
  );

  return Plot.plot({
    width: size,
    height: size,
    margin: 14,
    projection: {type: "azimuthal-equidistant", rotate: [0, -90], domain},
    color: {
      legend: series.length > 1,
      domain: series.map((s) => s.name),
      range: series.map((s) => s.color)
    },
    marks: [
      Plot.geo(rings, {
        geometry: (r) => d3.geoCircle().center([0, 90]).radius(r)(),
        stroke: "currentColor",
        fill: "currentColor",
        strokeOpacity: 0.25,
        fillOpacity: 0.02,
        strokeWidth: 0.5
      }),
      Plot.link(axisNames, {
        x1: longitude,
        y1: 90 - 1.05,
        x2: 0,
        y2: 90,
        stroke: "currentColor",
        strokeOpacity: 0.3,
        strokeWidth: 1
      }),
      Plot.text(axisNames, {
        x: longitude,
        y: 90 - labelRadius,
        text: (d) => d,
        fill: (d) => axisColorByLabel[d] ?? "currentColor",
        fontWeight: 600,
        fontSize: 12
      }),
      Plot.area(points, {
        x1: (d) => longitude(d.key),
        y1: (d) => 90 - d.ratio,
        x2: 0,
        y2: 90,
        fill: "series",
        stroke: "series",
        curve: "cardinal-closed",
        // emphasized series (e.g. "Category") already looks like its own
        // ":hover" state at rest, so it reads as the primary shape without
        // needing to be pointed at; the other series stays understated
        // until hovered
        fillOpacity: (d) => (d.emphasis ? 0.32 : 0.1),
        strokeOpacity: (d) => (d.emphasis ? 0.9 : 0.45),
        strokeWidth: (d) => (d.emphasis ? 2.5 : 1.5)
      }),
      Plot.dot(points, {
        x: (d) => longitude(d.key),
        y: (d) => 90 - d.ratio,
        fill: "series",
        stroke: "white",
        r: (d) => (d.emphasis ? 3.5 : 2.5)
      }),
      Plot.text(
        points,
        Plot.pointer({
          x: (d) => longitude(d.key),
          y: (d) => 90 - d.ratio,
          text: (d) => `${d.rawLabel}: ${d.rawValue.toFixed(2)}`,
          textAnchor: "start",
          dx: 6,
          fill: "currentColor",
          stroke: "white",
          maxRadius: 12
        })
      ),
      () => svg`<style>
        g[aria-label=area]:hover path:not(:hover) {fill-opacity: 0.05; transition: fill-opacity .2s;}
        g[aria-label=area] path:hover {fill-opacity: 0.42; stroke-opacity: 1; transition: fill-opacity .2s, stroke-opacity .2s;}
      `
    ]
  });
}
```

```js
const categoryRows = games.filter(
  (d) => d.season === season && d.category === category
);
const teamRows = categoryRows.filter((d) => d.team === team);
```

```js
const playerGames = teamRows
  .filter((d) => d.player === player)
  .sort((a, b) => d3.ascending(a.date, b.date));
```

```js
// player radar pool: given a set of rows, the per-player season averages
// and the max of those averages per stat (used to normalize the radar)
function playerScopeValues(rows) {
  const averages = d3.rollup(
    rows,
    (v) => Object.fromEntries(statKeys.map((k) => [k, d3.mean(v, (d) => d[k])])),
    (d) => d.player
  );
  const axisMax = Object.fromEntries(
    statKeys.map((k) => [k, d3.max(Array.from(averages.values(), (d) => d[k]))])
  );
  return statKeys.map((k) => ({
    axis: radarAxisLabels[k],
    rawLabel: statLabels[k],
    value: averages.get(player)?.[k] ?? 0,
    max: axisMax[k],
    invert: radarInvertedKeys.has(k)
  }));
}

// two pools shown together instead of a toggle: "Category" scales against
// every player in the same season + category (a U15 max shouldn't dilute a
// U17 chart); "Team" narrows that down to just this player's own roster.
const playerCategoryValues = playerScopeValues(categoryRows);
const playerTeamValues = playerScopeValues(teamRows);
```

```js
const pointBreakdown = playerGames.flatMap((d) => [
  {date: d.date, opponent: d.opponent, type: "FT", value: d.free_throws * 1},
  {date: d.date, opponent: d.opponent, type: "2P", value: d.two_pointers * 2},
  {date: d.date, opponent: d.opponent, type: "3P", value: d.three_pointers * 3}
]);
const opponentByDate = new Map(playerGames.map((d) => [d.date, d.opponent]));
```

```js
// team radar: this team's per-game production on each axis, scaled against
// the best team in the same season + category ("top teams' score per category")
const teamGameTotals = d3.rollups(
  categoryRows,
  (rows) => Object.fromEntries(statKeys.map((k) => [k, d3.sum(rows, (d) => d[k])])),
  (d) => d.team,
  (d) => d.game_id
);
const teamAverages = new Map(
  teamGameTotals.map(([teamName, gamesForTeam]) => [
    teamName,
    Object.fromEntries(
      statKeys.map((k) => [k, d3.mean(gamesForTeam, ([, totals]) => totals[k])])
    )
  ])
);
const teamAxisMax = Object.fromEntries(
  statKeys.map((k) => [k, d3.max(Array.from(teamAverages.values(), (d) => d[k]))])
);
const teamRadarValues = statKeys.map((k) => ({
  axis: radarAxisLabels[k],
  rawLabel: statLabels[k],
  value: teamAverages.get(team)?.[k] ?? 0,
  max: teamAxisMax[k],
  invert: radarInvertedKeys.has(k)
}));
```

```js
// roster table: one row per player's season averages, plus a team-average row
function perPlayerAverages(rows) {
  return d3.rollups(
    rows,
    (v) => ({
      games: v.length,
      ppg: d3.mean(v, (d) => d.points),
      onePg: d3.mean(v, (d) => d.free_throws),
      twoPg: d3.mean(v, (d) => d.two_pointers),
      threePg: d3.mean(v, (d) => d.three_pointers),
      foulsPg: d3.mean(v, (d) => d.fouls)
    }),
    (d) => d.player
  ).map(([rosterPlayer, s]) => ({player: rosterPlayer, ...s}));
}

// link each player's name to their own summary page — except "Team average"
// (not a real player) and the player already being viewed (linking to
// yourself is pointless, and this table doubles as the single-row summary
// shown at the top of the player view)
function rosterPlayerCell(name) {
  if (name === "Team average" || name === player) {
    return document.createTextNode(name);
  }
  const a = document.createElement("a");
  a.href = siblingHref({player: name});
  a.textContent = name;
  return a;
}

const rosterTableOptions = {
  columns: ["player", "games", "ppg", "onePg", "twoPg", "threePg", "foulsPg"],
  header: {
    player: "Player",
    games: "G",
    ppg: "PPG",
    onePg: "1P/G",
    twoPg: "2P/G",
    threePg: "3P/G",
    foulsPg: "Fouls/G"
  },
  format: {
    player: rosterPlayerCell,
    ppg: (x) => x.toFixed(2),
    onePg: (x) => x.toFixed(2),
    twoPg: (x) => x.toFixed(2),
    threePg: (x) => x.toFixed(2),
    foulsPg: (x) => x.toFixed(2)
  },
  width: {player: 200},
  layout: "auto",
  select: false
};

const teamGameCount = new Set(teamRows.map((d) => d.game_id)).size;
const rosterTableData = [
  ...perPlayerAverages(teamRows).sort((a, b) => d3.descending(a.ppg, b.ppg)),
  {
    player: "Team average",
    games: teamGameCount,
    ppg: d3.sum(teamRows, (d) => d.points) / teamGameCount,
    onePg: d3.sum(teamRows, (d) => d.free_throws) / teamGameCount,
    twoPg: d3.sum(teamRows, (d) => d.two_pointers) / teamGameCount,
    threePg: d3.sum(teamRows, (d) => d.three_pointers) / teamGameCount,
    foulsPg: d3.sum(teamRows, (d) => d.fouls) / teamGameCount
  }
];
```

```js
// team view: every team in this season+category; player view: every player
// on this team. Deliberately includes the current one too (not just the
// "others") so the link list is identical no matter which team/player
// you're on — nothing shifts around as you navigate. Floats beside the
// page (see <style> above) rather than taking a spot in the content flow.
function siblingHref(overrides) {
  const p = new URLSearchParams({season, category, team, ...overrides});
  return `/team/?${p.toString()}`;
}

function siblingList() {
  const current = player === "" ? team : player;
  const label = player === "" ? "Teams" : "Players";
  const items =
    player === ""
      ? d3.sort(new Set(categoryRows.map((d) => d.team))).map((t) => ({name: t, href: siblingHref({team: t})}))
      : d3.sort(new Set(teamRows.map((d) => d.player))).map((p) => ({name: p, href: siblingHref({player: p})}));
  return {label, current, items};
}

function siblingListElement({current, items}) {
  const list = document.createElement("ul");
  for (const {name, href} of items) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = name;
    if (name === current) a.className = "current";
    li.appendChild(a);
    list.appendChild(li);
  }
  return list;
}

// desktop: fixed sidebar beside the content
function siblingNav() {
  const {label, current, items} = siblingList();
  const nav = document.createElement("nav");
  nav.className = "sibling-nav";
  const heading = document.createElement("div");
  heading.className = "sibling-nav-heading";
  heading.textContent = label;
  nav.append(heading, siblingListElement({current, items}));
  return nav;
}

// mobile: a native <details> disclosure inline in the content flow —
// collapsed by default, summary shows the current selection so you don't
// need to open it just to see where you are
function siblingNavMobile() {
  const {label, current, items} = siblingList();
  const details = document.createElement("details");
  details.className = "sibling-nav-mobile";
  const summary = document.createElement("summary");
  summary.textContent = `${label}: ${current}`;
  details.append(summary, siblingListElement({current, items}));
  return details;
}
```

```js
siblingNav()
```

# ${player === "" ? team : player}

<div class="page-subheading">${(player === "" ? [category, season] : [team, category, season]).join(", ")}</div>

```js
siblingNavMobile()
```

```js
player === ""
  ? document.createElement("span")
  : Inputs.table(perPlayerAverages(playerGames), {
      ...rosterTableOptions,
      height: 60
    })
```

```js
// convert {value, max, invert} into a plot-ready 0..1 ratio (further out =
// always better, matching the invert convention used throughout this page)
function toRatio(values) {
  return values.map((v) => ({
    axis: v.axis,
    rawLabel: v.rawLabel,
    rawValue: v.value,
    ratio: v.max > 0 ? (v.invert ? 1 - v.value / v.max : v.value / v.max) : 0
  }));
}

const radarSeries =
  player === ""
    ? [{name: "Category", color: "#6366F1", values: toRatio(teamRadarValues), emphasis: true}]
    : [
        {name: "Category", color: "#6366F1", values: toRatio(playerCategoryValues), emphasis: true},
        {name: "Team", color: "#F97316", values: toRatio(playerTeamValues)}
      ];
```

```js
radarPlot(radarSeries, {size: 480})
```

```js
// team view keeps a heading (a real table needs the label); player view's
// bar chart is self-explanatory (axis + legend already say "points"), so
// skip the heading there rather than repeat "Points per game" redundantly
player === ""
  ? Object.assign(document.createElement("h2"), {textContent: "Season averages"})
  : document.createElement("span")
```

```js
player === ""
  ? Inputs.table(rosterTableData, {
      ...rosterTableOptions,
      height: (rosterTableData.length + 2) * 30
    })
  : Plot.plot({
      marginBottom: 80,
      x: {
        type: "band",
        label: null,
        tickFormat: (d) => opponentByDate.get(d) ?? d,
        tickRotate: -20
      },
      y: {label: "Points"},
      color: {
        legend: true,
        domain: ["FT", "2P", "3P"],
        range: [statColors.free_throws, statColors.two_pointers, statColors.three_pointers]
      },
      marks: [
        Plot.barY(pointBreakdown, {
          x: "date",
          y: "value",
          fill: "type",
          stroke: "white",
          strokeWidth: 1,
          channels: {Date: "date", Opponent: "opponent"},
          tip: true
        })
      ]
    })
```
