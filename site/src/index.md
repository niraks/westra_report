<style>
main {
  max-width: 720px;
}
main svg {
  max-width: 100%;
  height: auto;
}

@media (max-width: 700px) {
  main div.observablehq--block:has(> svg) {
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
  }
}
</style>

```js
const games = FileAttachment("./data/games.json").json();
```

```js
function buildTree(rows) {
  const bySeason = d3.group(
    rows,
    (d) => d.season,
    (d) => d.category,
    (d) => d.team,
    (d) => d.player
  );
  return {
    name: "Statistics",
    children: Array.from(bySeason, ([season, categories]) => ({
      name: season,
      children: Array.from(categories, ([category, teams]) => ({
        name: category,
        children: Array.from(teams, ([team, players]) => ({
          name: team,
          children: Array.from(players.keys(), (player) => ({name: player}))
        }))
      }))
    }))
  };
}

const root = d3.hierarchy(buildTree(games));
```

```js
function teamOrPlayerHref(d) {
  const chain = d.ancestors().reverse(); // [root, season, category, team, player?]
  const p = new URLSearchParams();
  if (chain[1]) p.set("season", chain[1].data.name);
  if (chain[2]) p.set("category", chain[2].data.name);
  if (chain[3]) p.set("team", chain[3].data.name);
  if (chain[4]) p.set("player", chain[4].data.name);
  return `/team/?${p.toString()}`;
}

function categoryHref(d) {
  const chain = d.ancestors().reverse(); // [root, season, category]
  const p = new URLSearchParams();
  if (chain[1]) p.set("season", chain[1].data.name);
  if (chain[2]) p.set("category", chain[2].data.name);
  return `/categories/?${p.toString()}`;
}
```

```js
function zoomableSunburst(root, {size = 700} = {}) {
  root.sum((d) => (d.children ? 0 : 1));
  root.sort((a, b) => b.value - a.value);
  d3.partition().size([2 * Math.PI, root.height + 1])(root);
  root.each((d) => (d.current = d));

  // only one ring is shown at a time
  const centerRadius = size * 0.12;
  const maxRadius = size / 2;
  const radiusScale = d3.scaleLinear().domain([0, 1, 2]).range([0, centerRadius, maxRadius]);

  const arc = d3
    .arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(maxRadius * 1.5)
    .innerRadius((d) => radiusScale(d.y0))
    .outerRadius((d) => Math.max(radiusScale(d.y0), radiusScale(d.y1) - 1));

  // depth 0 = root (center circle), 1 = season, 2 = category,
  // 3 = team, 4 = player.
  const depthOpacity = [0, 0.16, 0.11, 0.075, 0.05];

  function arcVisible(d) {
    return d.y1 <= 2 && d.y0 >= 1 && d.x1 > d.x0;
  }
  function labelVisible(d) {
    return d.y1 <= 2 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.035;
  }
  function labelTransform(d) {
    const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
    const y = (radiusScale(d.y0) + radiusScale(d.y1)) / 2;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  const svg = d3
    .create("svg")
    .attr("viewBox", [-size / 2, -size / 2, size, size])
    .attr("width", size)
    .attr("height", size)
    .attr("font-family", "sans-serif")
    .attr("font-size", 15);

  const g = svg.append("g");

  const descendants = root.descendants().slice(1); // exclude root; it's the center circle

  const path = g
    .append("g")
    .selectAll("path")
    .data(descendants)
    .join("path")
    .attr("fill", "currentColor")
    .attr("fill-opacity", (d) => (arcVisible(d.current) ? depthOpacity[d.depth] : 0))
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", (d) => (arcVisible(d.current) ? 0.25 : 0))
    .attr("stroke-width", 1)
    .attr("pointer-events", (d) => (arcVisible(d.current) ? "all" : "none"))
    .attr("d", (d) => arc(d.current));

  path.append("title").text((d) =>
    d.ancestors().map((a) => a.data.name).reverse().slice(1).join(" / ")
  );

  path.filter((d) => d.children).style("cursor", "pointer").on("click", clicked);

  // season name: plain label, no navigation (no season-level page)
  const label = g
    .append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(descendants.filter((d) => d.depth === 1))
    .join("text")
    .attr("dy", "0.32em")
    .attr("font-weight", 600)
    .attr("fill", "currentColor")
    .attr("fill-opacity", (d) => +labelVisible(d.current))
    .attr("transform", (d) => labelTransform(d.current))
    .text((d) => d.data.name);

  // category/team/player names: real links (category -> its summary page,
  // team/player -> the team/player summary page)
  const linkLabel = g
    .append("g")
    .attr("text-anchor", "middle")
    .selectAll("a")
    .data(descendants.filter((d) => d.depth >= 2))
    .join("a")
    .attr("href", (d) => (d.depth === 2 ? categoryHref(d) : teamOrPlayerHref(d)))
    .style("cursor", "pointer")
    .attr("fill-opacity", (d) => +labelVisible(d.current))
    .attr("transform", (d) => labelTransform(d.current));

  linkLabel
    .append("text")
    .attr("dy", "0.32em")
    .attr("fill", "#2F6BBD")
    .attr("font-weight", 500)
    .text((d) => d.data.name);

  const parent = g
    .append("circle")
    .datum(root)
    .attr("r", centerRadius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .style("cursor", "pointer")
    .on("click", clicked);

  function clicked(event, p) {
    parent.datum(p.parent || root);

    root.each(
      (d) =>
        (d.target = {
          x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
          y0: Math.max(0, d.y0 - p.depth),
          y1: Math.max(0, d.y1 - p.depth)
        })
    );

    const t = g.transition().duration(600);

    path
      .transition(t)
      .tween("data", (d) => {
        const i = d3.interpolate(d.current, d.target);
        return (tt) => (d.current = i(tt));
      })
      .attr("fill-opacity", (d) => (arcVisible(d.target) ? depthOpacity[d.depth] : 0))
      .attr("stroke-opacity", (d) => (arcVisible(d.target) ? 0.25 : 0))
      .attr("pointer-events", (d) => (arcVisible(d.target) ? "all" : "none"))
      .attrTween("d", (d) => () => arc(d.current));

    label
      .transition(t)
      .attr("fill-opacity", (d) => +labelVisible(d.target))
      .attrTween("transform", (d) => () => labelTransform(d.current));

    linkLabel
      .transition(t)
      .attr("fill-opacity", (d) => +labelVisible(d.target))
      .attrTween("transform", (d) => () => labelTransform(d.current));
  }

  return svg.node();
}
```

```js
zoomableSunburst(root, {size: 700})
```

Click a wedge to zoom in, click the center to zoom back out. 
Click a team or player's name to jump straight to their stats.
