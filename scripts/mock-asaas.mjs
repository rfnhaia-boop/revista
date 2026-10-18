// Asaas falso para desenvolvimento local: ASAAS_BASE_URL=http://localhost:4010 (só vale em sandbox).
import { createServer } from "node:http";
let n = 0;
let seq = 0;
const log = [];
const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const send = (code, data) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
    if (!req.headers.access_token && req.url !== "/__log") return send(401, { errors: [{ description: "Chave inválida." }] });
    if (req.method === "POST" && req.url === "/accounts") {
      const b = JSON.parse(body || "{}");
      if (b.name === "RECUSAR") return send(400, { errors: [{ description: "CPF/CNPJ já utilizado em outra conta." }] });
      if (b.name === "QUEDA") return send(500, {});
      n++;
      return send(200, { id: `acc_mock_${n}`, walletId: `wallet_mock_${n}`, apiKey: "nao-guardar" });
    }
    const b = body ? JSON.parse(body) : {};
    if (req.method === "GET" && req.url === "/__log") return send(200, log);
    if (req.method === "POST" && req.url === "/customers") { log.push({ route: "customers", ...b }); return send(200, { id: `cus_mock_${++seq}` }); }
    if (req.method === "POST" && req.url === "/payments") { log.push({ route: "payments", ...b }); return send(200, { id: `pay_mock_${++seq}` }); }
    if (req.method === "POST" && req.url === "/subscriptions") { log.push({ route: "subscriptions", ...b }); const id = `sub_mock_${++seq}`; return send(200, { id, firstPayment: `pay_${id}_1` }); }
    let m;
    if (req.method === "POST" && (m = req.url.match(/^\/payments\/([^/]+)\/refund$/))) { log.push({ route: "refund", id: m[1] }); if (m[1] === "pay_recusa") return send(400, { errors: [{ description: "Saldo insuficiente para estorno." }] }); return send(200, { id: m[1], status: "REFUNDED" }); }
    if (req.method === "GET" && (m = req.url.match(/^\/payments\/([^/]+)\/pixQrCode$/))) return send(200, { encodedImage: PNG, payload: "00020126mock" + m[1], expirationDate: "2099-01-01" });
    if (req.method === "GET" && (m = req.url.match(/^\/subscriptions\/([^/]+)\/payments$/))) return send(200, { data: [{ id: `pay_${m[1]}_1` }] });
    if (req.method === "DELETE" && (m = req.url.match(/^\/subscriptions\/([^/]+)$/))) { log.push({ route: "cancel", id: m[1] }); return send(200, { deleted: true }); }
    send(404, { errors: [{ description: "Rota inexistente no mock." }] });
  });
}).listen(4010, () => console.log("mock Asaas em :4010"));
