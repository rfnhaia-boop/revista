const fs = require("fs");
let s = fs.readFileSync("lib/editorial-patches.mjs", "utf8");
function rep(a, b) { if (!s.includes(a)) throw new Error("nao achei: " + a.slice(0, 50)); s = s.replace(a, () => b); }
rep(`    before: "## O nascimento do ser humano múltiplo",
    marker: "## O Flow Arquetípico",
    text: \`## O Flow Arquetípico
`, `    before: "**04 · UMA POSSIBILIDADE**",
    marker: "04 · HIPÓTESE AUTORAL",
    // O site numera a nova seção como 04 e empurra as seguintes.
    renumber: [
      ["**05 · FILOSOFIA E RESPONSABILIDADE**", "**06 · FILOSOFIA E RESPONSABILIDADE**"],
      ["**04 · UMA POSSIBILIDADE**", "**05 · UMA POSSIBILIDADE**"],
    ],
    text: \`**04 · HIPÓTESE AUTORAL**

## O Flow Arquetípico
`);
rep(`    body = \`\${body.slice(0, at)}\${flow.text}\n\n\${body.slice(at)}\`;
  }`, `    body = \`\${body.slice(0, at)}\${flow.text}\n\n\${body.slice(at)}\`;
    for (const [from, to] of flow.renumber ?? []) {
      if (!body.includes(from)) throw new Error(\`Rótulo não encontrado em \${article.slug}: \${from}\`);
      body = body.replace(from, to);
    }
  }`);
fs.writeFileSync("lib/editorial-patches.mjs", s);
