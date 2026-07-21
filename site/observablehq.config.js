import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";

function readGeneratedDate() {
  const metaPath = fileURLToPath(new URL("../data/meta.json", import.meta.url));
  try {
    return JSON.parse(readFileSync(metaPath, "utf-8")).generated;
  } catch {
    return null;
  }
}

const generated = readGeneratedDate();

export default {
  title: "Westra Stats",
  root: "src",
  theme: "light",
  pages: [{name: "Players", path: "/players/"}],
  sidebar: false,
  toc: false,
  pager: false,
  header: `
    <nav style="display: flex; justify-content: center; gap: 1.5rem; align-items: center; font-size: 0.875rem; width: 100%;">
      <a href="/" style="font-weight: 600;">Westra Stats</a>
      <a href="/players/">Players</a>
      <a href="/teams/">Teams</a>
      <a href="/issues/">Issues</a>
    </nav>
  `,
  footer: generated
    ? `<div style="text-align: center; opacity: 0.6;">Statistics updated ${generated}</div>`
    : false
};
