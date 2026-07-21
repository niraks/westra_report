<style>
main {
  max-width: 720px;
}
main svg {
  max-width: 100%;
  height: auto;
}
main div.observablehq--block:has(> form[class*="-table"]) {
  margin: 0.25rem 0;
}

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
   flow, collapsed by default - shown only where the fixed sidebar (above)
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
import {statLabels, statColors} from "../lib/stats.js";
```

```js
// this page is only ever reached via a generated link (the sunburst's
// Category names) that already supplies season+category — no pickers here
const params = new URLSearchParams(location.search);
const season = params.get("season") ?? "";
const category = params.get("category") ?? "";
```

```js
const categoryRows = games.filter((d) => d.season === season && d.category === category);
```

```js
function teamHref(teamName) {
  const p = new URLSearchParams({season, category, team: teamName});
  return `/team/?${p.toString()}`;
}

function teamLink(name) {
  const a = document.createElement("a");
  a.href = teamHref(name);
  a.textContent = name;
  return a;
}
```

```js
// every category in this season, including the current one, so the list
// never shifts around as you switch between categories
function categoryListItems() {
  const categoriesForSeason = d3.sort(
    new Set(games.filter((d) => d.season === season).map((d) => d.category))
  );
  return categoriesForSeason.map((c) => {
    const p = new URLSearchParams({season, category: c});
    return {name: c, href: `/categories/?${p.toString()}`};
  });
}

function categoryListElement(items) {
  const list = document.createElement("ul");
  for (const {name, href} of items) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = href;
    a.textContent = name;
    if (name === category) a.className = "current";
    li.appendChild(a);
    list.appendChild(li);
  }
  return list;
}

// desktop: fixed sidebar beside the content
function categoryNav() {
  const nav = document.createElement("nav");
  nav.className = "sibling-nav";
  const heading = document.createElement("div");
  heading.className = "sibling-nav-heading";
  heading.textContent = "Categories";
  nav.append(heading, categoryListElement(categoryListItems()));
  return nav;
}

// mobile: a native <details> disclosure inline in the content flow —
// collapsed by default, summary shows the current category so you don't
// need to open it just to see where you are
function categoryNavMobile() {
  const details = document.createElement("details");
  details.className = "sibling-nav-mobile";
  const summary = document.createElement("summary");
  summary.textContent = `Category: ${category}`;
  details.append(summary, categoryListElement(categoryListItems()));
  return details;
}
```

```js
categoryNav()
```

```js
// team summary: same per-game aggregation as the "Team average" row on the
// team page, just computed for every team in the category at once
const teamTableData = d3.rollups(
  categoryRows,
  (rows) => {
    const gameCount = new Set(rows.map((d) => d.game_id)).size;
    return {
      games: gameCount,
      ppg: d3.sum(rows, (d) => d.points) / gameCount,
      onePg: d3.sum(rows, (d) => d.free_throws) / gameCount,
      twoPg: d3.sum(rows, (d) => d.two_pointers) / gameCount,
      threePg: d3.sum(rows, (d) => d.three_pointers) / gameCount,
      foulsPg: d3.sum(rows, (d) => d.fouls) / gameCount
    };
  },
  (d) => d.team
)
  .map(([team, s]) => ({team, ...s}))
  .sort((a, b) => d3.descending(a.ppg, b.ppg));

const teamTableOptions = {
  columns: ["team", "games", "ppg", "onePg", "twoPg", "threePg", "foulsPg"],
  header: {
    team: "Team",
    games: "G",
    ppg: "PPG",
    onePg: "1P/G",
    twoPg: "2P/G",
    threePg: "3P/G",
    foulsPg: "Fouls/G"
  },
  format: {
    team: teamLink,
    ppg: (x) => x.toFixed(2),
    onePg: (x) => x.toFixed(2),
    twoPg: (x) => x.toFixed(2),
    threePg: (x) => x.toFixed(2),
    foulsPg: (x) => x.toFixed(2)
  },
  width: {team: 220},
  layout: "auto",
  select: false
};
```

```js
// one row per player's per-game averages across the whole category (every
// team), the pool the leaderboards below are drawn from
const playerAverages = d3.rollups(
  categoryRows,
  (rows) => ({
    team: rows[0].team,
    games: rows.length,
    ppg: d3.mean(rows, (d) => d.points),
    onePg: d3.mean(rows, (d) => d.free_throws),
    twoPg: d3.mean(rows, (d) => d.two_pointers),
    threePg: d3.mean(rows, (d) => d.three_pointers),
    foulsPg: d3.mean(rows, (d) => d.fouls)
  }),
  (d) => d.player
).map(([player, s]) => ({player, ...s}));
```

```js
// top N, extended past N to include every player tied with the Nth value
// (same rule the old markdown report's top-players section used); zero
// values are excluded so players who haven't made any get skipped
function topN(rows, key, {n = 10} = {}) {
  const filtered = rows.filter((d) => key(d) > 0);
  const sorted = [...filtered].sort((a, b) => d3.descending(key(a), key(b)));
  if (sorted.length <= n) return sorted;
  const cutoff = key(sorted[n - 1]);
  let end = n;
  while (end < sorted.length && key(sorted[end]) === cutoff) end++;
  return sorted.slice(0, end);
}

function leaderboardChart(rows, {key, color, label} = {}) {
  return Plot.plot({
    height: Math.max(120, rows.length * 28 + 40),
    marginLeft: 140,
    marginRight: 50,
    x: {label, nice: true, grid: true},
    y: {label: null},
    marks: [
      Plot.barX(rows, {
        y: "player",
        x: key,
        fill: color,
        sort: {y: "-x"}
      }),
      Plot.text(rows, {
        y: "player",
        x: key,
        text: (d) => key(d).toFixed(2),
        dx: 6,
        textAnchor: "start",
        fill: "currentColor"
      })
    ]
  });
}
```

# ${category}, ${season}

```js
categoryNavMobile()
```

## Teams

```js
Inputs.table(teamTableData, teamTableOptions)
```

## Season leaders

### Points per game

```js
leaderboardChart(topN(playerAverages, (d) => d.ppg), {
  key: (d) => d.ppg,
  color: "currentColor",
  label: "Points per game"
})
```

### 2-pointers made per game

```js
leaderboardChart(topN(playerAverages, (d) => d.twoPg), {
  key: (d) => d.twoPg,
  color: statColors.two_pointers,
  label: statLabels.two_pointers
})
```

### 3-pointers made per game

```js
leaderboardChart(topN(playerAverages, (d) => d.threePg), {
  key: (d) => d.threePg,
  color: statColors.three_pointers,
  label: statLabels.three_pointers
})
```

### Free throws made per game

```js
leaderboardChart(topN(playerAverages, (d) => d.onePg), {
  key: (d) => d.onePg,
  color: statColors.free_throws,
  label: statLabels.free_throws
})
```
