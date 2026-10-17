import Link from "next/link";
import { company, legalDraft, LEGAL_VERSION } from "@/lib/legal";

export const metadata = { title: "Política de Privacidade · Revista NEW", description: "Quais dados a Revista NEW coleta, para que usa, com quem compartilha e quais são os seus direitos." };

export default function Page() {
  const c = company();
  const date = new Date(LEGAL_VERSION + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <article className="legal">
      {legalDraft() && <p className="legal-draft" role="note">Minuta em revisão jurídica. O texto pode mudar antes da abertura pública.</p>}
      <h1>Política de Privacidade</h1>
      <p className="legal-meta">Versão de {date} · <Link href="/termos">Termos de Uso</Link></p>

      <p>Esta política explica, em linguagem simples, como a Revista NEW trata seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).</p>

      <h2>1. Quem é o controlador</h2>
      <p>{c.name}, CNPJ {c.cnpj}, {c.address}. Encarregado de dados (DPO): {c.privacyEmail}.</p>

      <h2>2. Quais dados tratamos e para quê</h2>
      <table className="legal-table">
        <thead><tr><th>Dado</th><th>Para quê</th><th>Base legal</th></tr></thead>
        <tbody>
          <tr><td>Nome, e-mail, telefone e senha (guardada só em forma criptografada)</td><td>Criar e manter sua conta e entrar com segurança</td><td>Execução do contrato</td></tr>
          <tr><td>Perfil público (nome, apresentação, cidade, interesses, link)</td><td>Exibir seu perfil e Caderno a outros leitores</td><td>Execução do contrato</td></tr>
          <tr><td>Textos, respostas, curtidas, itens salvos e quem você segue</td><td>Funcionamento da comunidade e do seu Caderno</td><td>Execução do contrato</td></tr>
          <tr><td>Leituras dos textos, contadas de forma anônima (uma chave gerada por hash a partir do navegador, sem guardar seu IP)</td><td>Mostrar ao autor quantas pessoas leram, sem identificar quem</td><td>Legítimo interesse</td></tr>
          <tr><td>Registros de compra e assinatura (valor, data, status)</td><td>Liberar o acesso, cancelar, estornar e cumprir obrigações fiscais</td><td>Execução do contrato e obrigação legal</td></tr>
          <tr><td>CPF/CNPJ e dados cadastrais para receber ou pagar</td><td>Emitir o Pix e abrir a conta de recebimento do criador. Enviados ao provedor de pagamento e <strong>não guardados por nós</strong></td><td>Execução do contrato e obrigação legal</td></tr>
          <tr><td>Registro do aceite dos Termos (versão, data e origem)</td><td>Comprovar que você aceitou os textos vigentes</td><td>Obrigação legal e exercício regular de direitos</td></tr>
          <tr><td>Registros de segurança e auditoria (ex.: ações administrativas)</td><td>Segurança e prevenção a fraude</td><td>Legítimo interesse</td></tr>
        </tbody>
      </table>

      <h2>3. Cookies e armazenamento no navegador</h2>
      <p>Usamos apenas o que é necessário: um cookie de sessão para manter você conectado (dura até 30 dias) e, no seu aparelho, preferências e anotações de leitura. <strong>Não usamos cookies de publicidade ou de rastreamento</strong>. Se isso mudar, pediremos seu consentimento antes.</p>

      <h2>4. Com quem compartilhamos</h2>
      <ul>
        <li><strong>Provedor de pagamento</strong> (hoje, o Asaas): para cobrar, repassar ao criador e verificar identidade de quem vende.</li>
        <li><strong>Infraestrutura:</strong> servidores contratados para hospedar a plataforma e os backups.</li>
        <li><strong>Autoridades</strong>, quando a lei ou ordem judicial exigir.</li>
      </ul>
      <p>Não vendemos seus dados. O que você publica como público fica visível a qualquer visitante.</p>

      <h2>5. Por quanto tempo guardamos</h2>
      <p>Enquanto sua conta existir. Depois de encerrada, apagamos ou anonimizamos os dados, exceto os que precisamos manter por obrigação legal (como registros de pagamento, por até 5 anos) ou para defesa em processos.</p>

      <h2>6. Seus direitos</h2>
      <p>Você pode pedir, a qualquer momento, pelo e-mail do encarregado: confirmação de que tratamos seus dados, acesso, correção, anonimização ou eliminação, portabilidade, informação sobre compartilhamento, revogação de consentimento e revisão de decisões automatizadas. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</p>

      <h2>7. Segurança</h2>
      <p>Senhas são guardadas com criptografia de via única, o tráfego é protegido por HTTPS, o acesso administrativo é restrito e registrado, e mantemos cópias de segurança. Nenhum sistema é totalmente imune; em caso de incidente relevante, avisaremos você e a ANPD conforme a lei.</p>

      <h2>8. Crianças e adolescentes</h2>
      <p>A plataforma é para maiores de 18 anos. Se soubermos que um menor criou conta, ela será removida.</p>

      <h2>9. Mudanças</h2>
      <p>Esta política pode mudar. Quando mudar de forma relevante, avisaremos na plataforma e pediremos novo aceite.</p>
    </article>
  );
}
