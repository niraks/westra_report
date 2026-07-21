# Player search

<style>
main {
  max-width: 720px;
}
main div.observablehq--block:has(> form[class*="-table"]) {
  margin: 0.25rem 0;
}
</style>

```js
const games = FileAttachment("../data/games.json").json();
```

```js
function playerHref({season, category, team, player}) {
  const p = new URLSearchParams({season, category, team, player});
  return `/team/?${p.toString()}`;
}

function playerLink(name, i, data) {
  const a = document.createElement("a");
  a.href = playerHref(data[i]);
  a.textContent = name;
  return a;
}
```

```js
// one row per distinct player+team+season+category combination
const playerRows = Array.from(
  d3.rollup(
    games,
    (rows) => rows[0],
    (d) => `${d.player}|${d.team}|${d.season}|${d.category}`
  ).values(),
  ({player, team, season, category}) => ({player, team, season, category})
).sort((a, b) => d3.ascending(a.player, b.player));
```

```js
const searchInput = Inputs.search(playerRows, {placeholder: "Search players…"});
const searchResults = view(searchInput);
```

```js
Inputs.table(searchResults, {
  columns: ["player", "team", "season", "category"],
  header: {player: "Player", team: "Team", season: "Season", category: "Category"},
  format: {player: playerLink},
  width: {player: 200, team: 200},
  layout: "auto",
  select: false
})
```
