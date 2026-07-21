# Team search

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
function teamHref({season, category, team}) {
  const p = new URLSearchParams({season, category, team});
  return `/team/?${p.toString()}`;
}

function teamLink(name, i, data) {
  const a = document.createElement("a");
  a.href = teamHref(data[i]);
  a.textContent = name;
  return a;
}
```

```js
// one row per distinct team+season+category combination
const teamRows = Array.from(
  d3.rollup(
    games,
    (rows) => rows[0],
    (d) => `${d.team}|${d.season}|${d.category}`
  ).values(),
  ({team, season, category}) => ({team, season, category})
).sort((a, b) => d3.ascending(a.team, b.team));
```

```js
const searchInput = Inputs.search(teamRows, {placeholder: "Search teams…"});
const searchResults = view(searchInput);
```

```js
Inputs.table(searchResults, {
  columns: ["team", "season", "category"],
  header: {team: "Team", season: "Season", category: "Category"},
  format: {team: teamLink},
  width: {team: 260},
  layout: "auto",
  select: false
})
```
