# Data issues

<style>
main {
  max-width: 960px;
}
main div.observablehq--block:has(> form[class*="-table"]) {
  margin: 0.25rem 0;
}
.issue-list {
  margin: 0;
  padding-left: 1.1rem;
}
.issue-list li {
  margin-bottom: 0.15rem;
}
</style>

Games where the score sheet PDF could not be fully parsed, or where the parsed
totals did not match the official result. Statistics for these games may be
incomplete or slightly off.

```js
const issues = FileAttachment("../data/issues.json").json();
```

```js
function teamHref(season, category, team) {
  const p = new URLSearchParams({season, category, team});
  return `/team/?${p.toString()}`;
}

function teamCell(name, i, data) {
  if (!name) return "?";
  const a = document.createElement("a");
  a.href = teamHref(data[i].season, data[i].category, name);
  a.textContent = name;
  return a;
}

function messagesCell(messages) {
  const ul = document.createElement("ul");
  ul.className = "issue-list";
  for (const m of messages) {
    const li = document.createElement("li");
    li.textContent = m;
    ul.appendChild(li);
  }
  return ul;
}
```

```js
const issueRows = [...issues].sort((a, b) => d3.descending(a.date ?? "", b.date ?? ""));
```

```js
const searchInput = Inputs.search(issueRows, {placeholder: "Search issues…"});
const searchResults = view(searchInput);
```

${issueRows.length} game(s) flagged.

```js
Inputs.table(searchResults, {
  columns: ["season", "category", "date", "home_team", "away_team", "messages"],
  header: {
    season: "Season",
    category: "Category",
    date: "Date",
    home_team: "Home",
    away_team: "Away",
    messages: "Issues"
  },
  format: {
    home_team: teamCell,
    away_team: teamCell,
    messages: messagesCell
  },
  width: {season: 110, category: 130, date: 90, home_team: 150, away_team: 150},
  layout: "auto",
  select: false
})
```
