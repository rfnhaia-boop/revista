"use client";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Apoio institucional à NEW Company. Só existe com FEATURE_MONEY=1; pagamento real ainda desativado. */
export default function SupportDialog({
  open,
  onOpenChange,
  amount,
  onAmount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  amount: number;
  onAmount: (n: number) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="project-dialog">
        <DialogTitle className="read-title">Uma equipe para a próxima etapa.</DialogTitle>
        <DialogDescription>
          Projeto da NEW Company · Campanha em preparação · Meta proposta de R$ 20.000
        </DialogDescription>
        <Tabs defaultValue="purpose">
          <TabsList className="view-tabs">
            <TabsTrigger value="purpose">Projeto</TabsTrigger>
            <TabsTrigger value="budget">Orçamento</TabsTrigger>
            <TabsTrigger value="accountability">Acompanhamento</TabsTrigger>
          </TabsList>
          <TabsContent value="purpose">
            <p>
              Estruturar uma equipe para desenvolver a plataforma, ampliar o trabalho editorial e acompanhar projetos de conhecimento.
            </p>
            <div className="notice">
              A NEW Company é a beneficiária deste apoio institucional. Esta campanha não é uma pesquisa de autor independente e não oferece retorno financeiro.
            </div>
            <div className="money-line">
              <strong>Meta {money(20000)}</strong>
              <span>Arrecadado R$ 0</span>
            </div>
            <Progress value={0} />
            <h3>Escolha seu valor de apoio</h3>
            <div className="amount-buttons">
              {[20, 50, 100].map((n) => (
                <button key={n} className={amount === n ? "chip active" : "chip"} onClick={() => onAmount(n)}>
                  {money(n)}
                </button>
              ))}
              <label className="amount-input">
                R${" "}
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  value={amount}
                  aria-label="Outro valor para apoiar a NEW"
                  onChange={(e) => onAmount(Math.min(1000000, Math.max(1, Number(e.target.value) || 1)))}
                />
              </label>
            </div>
            <button
              className="primary full"
              onClick={() => toast.info("Apoio à NEW em preparação. Pix desativado; nenhuma cobrança foi realizada.")}
            >
              Quero apoiar com {money(amount)}
            </button>
            <p className="fine">
              Nenhuma contribuição é registrada como recebida. Custos de processamento serão informados quando houver integração.
            </p>
          </TabsContent>
          <TabsContent value="budget">
            <h3>Destinação proposta</h3>
            <div className="budget-row"><span>Equipe e desenvolvimento</span><strong>{money(12000)}</strong></div>
            <div className="budget-row"><span>Infraestrutura e ferramentas</span><strong>{money(5000)}</strong></div>
            <div className="budget-row"><span>Operação editorial e acompanhamento</span><strong>{money(3000)}</strong></div>
            <div className="budget-row total"><span>Meta total</span><strong>{money(20000)}</strong></div>
            <p className="fine">
              Distribuição proposta para a campanha inicial. O orçamento final, prazos e regras de cancelamento serão publicados antes da abertura da arrecadação.
            </p>
          </TabsContent>
          <TabsContent value="accountability">
            <div className="timeline">
              <div className="timeline-row">
                <span>1</span>
                <div>
                  <h3>Proposta registrada</h3>
                  <p>Expansão do sistema e formação de equipe. Meta inicial sugerida de R$ 20 mil.</p>
                </div>
              </div>
              <div className="timeline-row">
                <span>2</span>
                <div>
                  <h3>Arrecadação não iniciada</h3>
                  <p>R$ 0 recebidos. Nenhuma despesa ou contratação atribuída à campanha.</p>
                </div>
              </div>
              <div className="timeline-row">
                <span>3</span>
                <div>
                  <h3>Atualizações públicas previstas</h3>
                  <p>Quando a campanha for aberta, o projeto deverá publicar uso dos recursos, entregas, dificuldades e relatório de encerramento.</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
