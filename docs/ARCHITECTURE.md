# Revista NEW — fundação v1

> Atualização (Módulo 0+1): runtime migrado do ChatGPT Sites/Vinext/D1 para Next.js 16 + Postgres (`db/client.ts`, `lib/storage.ts`). Autenticação por headers `oai-authenticated-user-*` removida; `lib/auth.ts` tem apenas usuário falso de dev até o login via Cofre (Módulo 2). Origem permitida vem de `APP_ORIGIN`.

## Implementado (original)
Vinext, React, TypeScript, Tailwind, D1, autenticação ChatGPT gerenciada pelo host (substituídos, ver acima).

## Limites explícitos
Painel editorial e projetos de demonstração não concedem permissões editoriais nem certificação científica. Pagamento real falha fechado. Não há upload de arquivos ainda. A versão não deve ser aberta ao público como operação financeira pronta. Política granular para editores, revisores e administração financeira deve ser implementada com convites verificados antes da abertura.

## Próximos módulos de produção
1. RBAC com concessões server-side e separação entre autores, editores, pareceristas e financeiro; MFA no provedor para ações sensíveis.
2. R2 privado para manuscritos, vídeos e evidências, URLs temporárias, validação de conteúdo e antimalware.
3. PSP Pix contratado: webhooks assinados, deduplicação, reconciliação, ledger em centavos, segregação por campanha, conciliação bancária, devoluções e dupla aprovação de repasses. O saldo exibido pelo navegador nunca autoriza repasse. A NEW pode coordenar a conta central; o enquadramento e o provedor são decisões jurídicas/contábeis pendentes.
4. Máquina de estados com transições autorizadas, revisão independente, conflitos de interesse, recursos e registro público redigido. Selo interno não equivale a revisão por pares nem prova de verdade.
5. Backups testados, restauração, monitoramento, alertas, limitação de abuso no gateway, revisão de segurança e retenção LGPD antes da operação pública.

## Modelo contratual proposto, sujeito a revisão profissional
Contrato de prestação de serviços de pesquisa entre NEW e executor; escopo, protocolo, orçamento, cronograma, marcos e critérios de entrega prévios. Crédito nominal de autoria; licença de publicação escrita com escopo definido. Contrato social constitui a sociedade e não substitui esse instrumento. Financiamento comunitário tem termos próprios para apoiadores: taxa, custos, destinação, cancelamento, seleção fracassada e reembolso. Pesquisa pode refutar a hipótese ou ser inconclusiva e receber por execução adequada. Aceite externo depende de terceiros; prazo de revisão, recurso e alternativa de avaliação independente precisam evitar retenção indefinida do saldo.

Percentuais 20/20/25/35 e taxa 5% na interface são simulações editáveis, não condições aprovadas. Selos somente serão emitidos quando houver critérios publicados e pareceres autenticados. Dados de apoiadores e participantes não ficam públicos. Indicadores do Observatório devem separar execução, resultado científico e publicação.

## Fontes primárias consultadas em 08/10/2026
- Código Civil, arts. 593–609 e 997: https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm
- Direitos autorais, arts. 22–24 e 49–50: https://www.planalto.gov.br/ccivil_03/leis/l9610.htm
- Lei 12.865/2013: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/lei/l12865.htm
- Banco Central, instituições de pagamento: https://www.bcb.gov.br/estabilidadefinanceira/instituicaopagamento

## Expansão — livros e apoio institucional
Tipos de submissão `book` e `new-project` usam a mesma persistência, autenticação e política de privacidade dos demais envios. Livros enviados permanecem privados e não são automaticamente incluídos em catálogo público ou certificados. A biblioteca tem um estado vazio honesto até existirem publicações autorizadas. Manuscritos binários continuam dependentes do futuro módulo de uploads.

A proposta institucional da NEW é exibida separadamente dos projetos de terceiros. Meta sugerida pelo usuário: R$ 20.000. Destinação ilustrativa: R$ 12.000 equipe, R$ 5.000 infraestrutura, R$ 3.000 operação editorial. R$ 0 arrecadados, sem pessoas ou despesas fictícias atribuídas à campanha. A NEW é identificada como beneficiária. Não se aplica taxa de intermediação de 5% a esse exemplo de projeto próprio. Nenhuma simulação cria registro de contribuição ou chama o endpoint financeiro.

## Selos NEW — página explicativa
Rota /selos apresenta Revisão Editorial, Parecer Independente, Revisado por Pares e Excelência Editorial. Uma mesma família de medalhões em vidro violeta, com identificação tipográfica NEW, descreve modalidades de avaliação; as imagens são marcadas como modelos. Não há emissão, atribuição, certificação ou verificação de selos reais nesta versão. O painel de registro explica os dados que a futura verificação exigirá e não fabrica revisores, decisões, identificadores ou aprovação. A concessão depende de políticas finais, conflitos de interesse, critérios por gênero e regras de correção, recurso e revogação. Troféus e área do apoiador não foram adicionados, conforme a prioridade do usuário.

## Rede de autores, marketplace e apoio NEW
Rotas /explorar, /pessoas, /pessoas/[slug], /caderno, /marketplace, /textos/[id] e /apoie. Perfis, textos, rascunhos, seguidores e leituras salvas persistem em D1. A identidade do autor é determinada no servidor; nenhuma função editorial é concedida pela criação de perfil. Textos são exibidos como plain text pelo React, sem HTML fornecido pelo autor. Links de perfis precisam usar HTTPS.

O endpoint /api/community projeta somente campos públicos. Textos pagos têm body NULL para qualquer visitante que não seja o autor; rascunhos só entram na resposta do proprietário. Preço em centavos, validação de acesso grátis/pago, consentimento, origem permitida, tamanho de entrada limitado e SQL parametrizado. Publicação e auditoria são gravadas em lote transacional. Seguir e salvar são ações idempotentes ligadas ao usuário. A descoberta começa por conteúdos recentes e filtros; nenhum algoritmo personalizado foi adicionado.

Compras avulsas estão em preparação. Não há checkout real, cobrança, comprovante fictício ou autorização de acesso comprador. Assinaturas recorrentes, repasses aos autores, moderação pública, cadastro financeiro e entrega de compras serão módulos posteriores. Os perfis e conteúdos de exemplo são identificados e não contam como registros reais. A abertura pública depende da política de moderação e dos controles de operação; a publicação continua privada para o proprietário.

/apoie identifica a NEW Company como beneficiária e destaca meta proposta de R$ 20 mil, orçamento, valor de apoio e acompanhamento. Histórico de apoio é um estado vazio até existirem pagamentos confirmados. Campanhas de pesquisadores continuam em /apoia. Doação institucional não concede aprovação ou selo. As páginas explicam a distinção entre conteúdo autoral independente e avaliação editorial da revista; revisão editorial não equivale a revisão por pares.
