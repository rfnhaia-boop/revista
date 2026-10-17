// Asaas falso para desenvolvimento local: ASAAS_BASE_URL=http://localhost:4010 (só vale em sandbox).
import { createServer } from "node:http";
let n = 0;
createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (code, data) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
    if (!req.headers.access_token) return send(401, { errors: [{ description: "Chave inválida." }] });
    if (req.method === "POST" && req.url === "/accounts") {
      const b = JSON.parse(body || "{}");
      if (b.name === "RECUSAR") return send(400, { errors: [{ description: "CPF/CNPJ já utilizado em outra conta." }] });
      if (b.name === "QUEDA") return send(500, {});
      n++;
      return send(200, { id: `acc_mock_${n}`, walletId: `wallet_mock_${n}`, apiKey: "nao-guardar" });
    }
    send(404, { errors: [{ description: "Rota inexistente no mock." }] });
  });
}).listen(4010, () => console.log("mock Asaas em :4010"));
