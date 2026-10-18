// Livro piloto do clube: Dom Casmurro (domínio público). Idempotente: não mexe se o livro já existir.
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL ausente");
const c = new pg.Client({ connectionString: url });
await c.connect();

const exists = await c.query("SELECT 1 FROM books WHERE slug='dom-casmurro'");
if (exists.rowCount) {
  console.log("já existe: dom-casmurro");
} else {
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await c.query(
    "INSERT INTO books (id,slug,title,author,year,description,license,license_note,status,created_by,created_at,updated_at) VALUES ($1,'dom-casmurro','Dom Casmurro','Machado de Assis',1899,$2,'public_domain',$3,'published','seed',$4,$4)",
    [
      id,
      "Memória, ciúme e a dúvida construída por quem narra. Edição piloto: início do capítulo I. O texto completo é carregado pela gestão.",
      "Machado de Assis (1839–1908): obra em domínio público no Brasil (autor falecido há mais de 70 anos). Trecho do capítulo I, edição piloto; conferir a edição-fonte antes de carregar o texto completo.",
      now,
    ],
  );
  const paragraphs = [
    "Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu.",
    "Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos.",
    "A viagem era curta, e os versos pode ser que não fossem inteiramente maus. Sucedeu, porém, que, como eu estava cansado, fechei os olhos três ou quatro vezes; tanto bastou para que ele interrompesse a leitura e metesse os versos no bolso.",
    "No dia seguinte entrou a dizer de mim nomes feios, e acabou alcunhando-me Dom Casmurro.",
    "Não consultes dicionários. Casmurro não está aqui no sentido que eles lhe dão, mas no que lhe pôs o vulgo de homem calado e metido consigo.",
    "O título ficou, e ele, apesar da alcunha, não me zangou. Contei a anedota aos amigos da cidade, e eles, por graça, chamam-me assim, alguns em bilhetes: Dom Casmurro, domingo vou jantar com você.",
  ];
  await c.query("INSERT INTO book_chapters (id,book_id,position,title,body) VALUES ($1,$2,1,'Capítulo I — Do título',$3)", [crypto.randomUUID(), id, paragraphs.join("\n\n")]);
  console.log("inserido: dom-casmurro");
}
await c.end();
