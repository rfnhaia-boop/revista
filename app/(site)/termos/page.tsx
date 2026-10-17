import Link from "next/link";
import { company, legalDraft, LEGAL_VERSION } from "@/lib/legal";

export const metadata = { title: "Termos de Uso · Revista NEW", description: "As regras de uso da Revista NEW: contas, conteúdo, pagamentos e responsabilidades." };

export default function Page() {
  const c = company();
  const date = new Date(LEGAL_VERSION + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
  return (
    <article className="legal">
      {legalDraft() && <p className="legal-draft" role="note">Minuta em revisão jurídica. O texto pode mudar antes da abertura pública.</p>}
      <h1>Termos de Uso</h1>
      <p className="legal-meta">Versão de {date} · <Link href="/privacidade">Política de Privacidade</Link></p>

      <h2>1. Quem somos e o que é a Revista NEW</h2>
      <p>A Revista NEW é uma plataforma de ideias e ciência operada por {c.name}, CNPJ {c.cnpj}, com sede em {c.address} (“NEW”). Ela reúne uma revista editada pela NEW e Cadernos de autores independentes, que podem publicar textos abertos ou pagos. Contato: {c.contactEmail}.</p>

      <h2>2. Quem pode usar</h2>
      <p>O acesso é feito por convite ou por cadastro validado. Você precisa ter 18 anos ou mais e informar dados verdadeiros. A conta é pessoal: não a compartilhe nem a transfira. Você é responsável pelo que acontece nela e deve avisar a NEW se suspeitar de uso indevido.</p>

      <h2>3. Conteúdo da NEW e conteúdo de autores</h2>
      <p>Os textos da revista são editados e publicados pela NEW. Os textos dos Cadernos são de responsabilidade exclusiva de quem os escreve e não recebem avaliação nem selo da NEW, salvo indicação expressa. O conteúdo da plataforma é informativo e educacional e <strong>não substitui aconselhamento profissional</strong> médico, psicológico, jurídico, financeiro ou de qualquer outra área regulamentada.</p>

      <h2>4. O que você publica</h2>
      <ul>
        <li>Você continua dono do que escreve. Ao publicar, autoriza a NEW a exibir, armazenar e divulgar o texto dentro da plataforma, pelo tempo em que ele estiver publicado.</li>
        <li>Você declara que o texto é seu ou que tem permissão para usá-lo, e que ele não viola direitos de terceiros, incluindo direitos autorais.</li>
        <li>É proibido publicar conteúdo ilegal, discriminatório, que incite violência, exponha dados pessoais de terceiros, faça apologia a crimes, engane leitores ou prometa resultados de saúde ou financeiros sem base.</li>
        <li>A NEW pode ocultar ou remover conteúdo que viole estes Termos ou a lei, e suspender contas, com aviso sempre que possível. Você pode pedir revisão da decisão pelo contato acima.</li>
        <li>Respostas e comentários são públicos no texto em que foram feitos; autores e a equipe podem ocultá-los.</li>
      </ul>

      <h2>5. Conteúdo pago, assinaturas e pagamentos</h2>
      <ul>
        <li>Criadores aprovados podem cobrar por textos avulsos ou por assinatura mensal do seu Caderno. A venda é feita pelo criador; a NEW oferece a plataforma e retém uma comissão sobre cada venda, informada ao criador antes de ele começar a vender.</li>
        <li>Os pagamentos são processados por um provedor de pagamento autorizado (hoje, o Asaas). Para emitir o Pix, o provedor recebe seu CPF ou CNPJ. A NEW não guarda esse número nem dados bancários.</li>
        <li>O preço exibido é o que será cobrado. O acesso é liberado automaticamente após a confirmação do pagamento.</li>
        <li><strong>Assinatura:</strong> é mensal e cobrada por Pix a cada ciclo, sem débito automático. Você pode cancelar quando quiser em Assinaturas; não haverá novas cobranças, e o acesso já pago continua até o fim do período.</li>
        <li><strong>Arrependimento e reembolso:</strong> nas compras feitas pela internet, você pode desistir em até 7 dias corridos, nos termos do Código de Defesa do Consumidor, pelo contato acima. Estornos e contestações revogam o acesso ao conteúdo correspondente.</li>
        <li>Criadores são responsáveis pelos próprios tributos sobre o que recebem.</li>
      </ul>

      <h2>6. Propriedade intelectual e livros</h2>
      <p>A marca, o desenho e o código da plataforma pertencem à NEW. Os livros e trechos disponíveis na plataforma estão em domínio público ou licenciados, e sua leitura é para uso pessoal. É proibido copiar, revender ou redistribuir conteúdo pago. Se achar que algo viola seus direitos, escreva para {c.contactEmail} indicando o texto e a razão; analisaremos com prioridade.</p>

      <h2>7. Uso adequado</h2>
      <p>Não tente acessar contas de terceiros, burlar a cobrança, sobrecarregar ou investigar vulnerabilidades da plataforma sem autorização, nem usar robôs para copiar conteúdo. Falhas de segurança podem ser reportadas para {c.contactEmail}.</p>

      <h2>8. Disponibilidade e responsabilidade</h2>
      <p>Trabalhamos para manter a plataforma no ar, mas ela pode ficar indisponível por manutenção ou falhas. Na extensão permitida em lei, a NEW não responde por conteúdo de autores, por decisões tomadas com base nos textos, nem por indisponibilidades fora do seu controle. Nada aqui limita direitos que a lei garante ao consumidor.</p>

      <h2>9. Encerramento</h2>
      <p>Você pode encerrar sua conta a qualquer momento pelo contato acima. A NEW pode suspender ou encerrar contas que violem estes Termos. Dados são tratados conforme a Política de Privacidade.</p>

      <h2>10. Mudanças</h2>
      <p>Podemos atualizar estes Termos. Quando houver mudança relevante, avisaremos na plataforma e pediremos novo aceite. Continuar usando depois do aviso, com o aceite, vale como concordância.</p>

      <h2>11. Lei aplicável</h2>
      <p>Estes Termos seguem a lei brasileira. Fica eleito o foro de {c.forum}, ressalvado o direito do consumidor de ajuizar ação em seu domicílio.</p>
    </article>
  );
}
