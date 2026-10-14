"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  FileText,
  Heart,
  Lock,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
type Project = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  area: string;
  problem: string;
  justification: string;
  expectedResult: string;
  stage: string;
  goalCents: number;
  budget: string;
  timeline: string;
  team: string;
  risks: string;
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  name: string;
  authorSlug: string;
  isMine: boolean;
  updateCount: number;
};
type Update = {
  id: string;
  projectId: string;
  title: string;
  body: string;
  createdAt: string;
};
type Round = {
  id: string;
  projectId: string;
  roundNumber: number;
  title: string;
  fundingModel: "all_or_nothing" | "flexible";
  minimumCents: number;
  targetCents: number;
  maximumCents: number;
  purpose: string;
  deliverables: string;
  status: "draft" | "ready";
};
const kinds = [
  "Pesquisa",
  "Livro",
  "Tecnologia",
  "Impacto social",
  "Produção cultural",
  "Expansão da NEW",
];
const stages = [
  "Ideia",
  "Planejamento",
  "Em execução",
  "Prestação de contas",
  "Concluído",
];
const money = (v: number) =>
  (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
async function mutate(payload: unknown) {
  const r = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = (await r.json()) as { error?: string };
  if (!r.ok) throw new Error(j.error || "Não foi possível salvar.");
  return j;
}
export default function ProjectsSpace({
  mode,
  signedIn,
  money: moneyOn,
}: {
  mode: "projetos" | "apoiador";
  signedIn: boolean;
  money: boolean;
}) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]),
    [updates, setUpdates] = useState<Update[]>([]),
    [rounds, setRounds] = useState<Round[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<Project | null>(null),
    [form, setForm] = useState(false),
    [updateForm, setUpdateForm] = useState(false),
    [roundForm, setRoundForm] = useState(false),
    [editing, setEditing] = useState<Project | null>(null),
    [consent, setConsent] = useState(false),
    [saving, setSaving] = useState(false),
    [formError, setFormError] = useState("");
  async function load() {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/projects");
      const j = (await r.json()) as {
        projects?: Project[];
        updates?: Update[];
        rounds?: Round[];
        error?: string;
      };
      if (!r.ok) throw new Error(j.error);
      setProjects(j.projects || []);
      setUpdates(j.updates || []);
      setRounds(j.rounds || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    return () => clearTimeout(t);
     
  }, []);
  const visible = useMemo(
    () =>
      projects.filter((p) =>
        (p.title + " " + p.kind + " " + p.area + " " + p.name)
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [projects, query],
  );
  function requireUser() {
    if (signedIn) return true;
    router.push("/entrar?return_to=%2Fprojetos");
    return false;
  }
  function openProject(p: Project | null = null) {
    if (!requireUser()) return;
    setEditing(p);
    setConsent(false);
    setFormError("");
    setForm(true);
  }
  async function saveProject(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    setSaving(true);
    setFormError("");
    try {
      await mutate({
        action: "project",
        id: editing?.id || crypto.randomUUID(),
        slug: String(f.get("slug")).toLowerCase().trim(),
        title: String(f.get("title")),
        kind: String(f.get("kind")),
        area: String(f.get("area")),
        problem: String(f.get("problem")),
        justification: String(f.get("justification")),
        expectedResult: String(f.get("expectedResult")),
        stage: String(f.get("stage")),
        goalCents: Math.round(Number(f.get("goal")) * 100),
        budget: String(f.get("budget")),
        timeline: String(f.get("timeline")),
        team: String(f.get("team")),
        risks: String(f.get("risks")),
        status: submitter?.value === "draft" ? "draft" : "published",
        consent,
      });
      setForm(false);
      toast.success(
        submitter?.value === "draft"
          ? "Rascunho salvo."
          : "Projeto publicado com transparência.",
      );
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }
  async function saveUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget);
    setSaving(true);
    setFormError("");
    try {
      await mutate({
        action: "update",
        projectId: selected.id,
        title: String(f.get("title")),
        body: String(f.get("body")),
        consent,
      });
      setUpdateForm(false);
      toast.success("Atualização publicada.");
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }
  async function saveRound(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const f = new FormData(e.currentTarget),
      intent = (
        (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null
      )?.value;
    setSaving(true);
    setFormError("");
    try {
      await mutate({
        action: "round",
        id: crypto.randomUUID(),
        projectId: selected.id,
        roundNumber: Number(f.get("roundNumber")),
        title: String(f.get("title")),
        fundingModel: String(f.get("fundingModel")),
        minimumCents: Math.round(Number(f.get("minimum")) * 100),
        targetCents: Math.round(Number(f.get("target")) * 100),
        maximumCents: Math.round(Number(f.get("maximum")) * 100),
        purpose: String(f.get("purpose")),
        deliverables: String(f.get("deliverables")),
        status: intent === "ready" ? "ready" : "draft",
        consent,
      });
      setRoundForm(false);
      toast.success(
        intent === "ready"
          ? "Rodada pronta para exibição."
          : "Rascunho da rodada salvo.",
      );
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }
  if (mode === "apoiador")
    return (
      <>
        <section className="community-heading">
          <div>
            <div className="eyebrow">MINHA ÁREA DE APOIO</div>
            <h1>O que você ajuda a tornar possível.</h1>
            <p>
              Projetos, assinaturas, compras, atualizações e comprovantes
              ficarão reunidos aqui.
            </p>
          </div>
        </section>
        <section className="supporter-dashboard">
          <div className="glass supporter-summary">
            <Wallet />
            <span>Total confirmado</span>
            <strong>R$ 0</strong>
            <small>Nenhuma cobrança realizada</small>
          </div>
          <div className="glass supporter-summary">
            <Heart />
            <span>Projetos apoiados</span>
            <strong>0</strong>
            <small>Apoios ainda não estão ativos</small>
          </div>
          <div className="glass supporter-summary">
            <BookOpen />
            <span>Conteúdos adquiridos</span>
            <strong>0</strong>
            <small>Compras ainda não estão ativas</small>
          </div>
        </section>
        <section className="glass empty supporter-empty">
          <Lock size={34} />
          <h2>Seu histórico começará com uma transação confirmada.</h2>
          <p>
            A plataforma não cria apoios, compras ou recibos simulados. Quando o
            sistema financeiro estiver validado, cada movimento aparecerá com
            valor, data, beneficiário, estado e comprovante.
          </p>
          <Link className="outline" href="/projetos">
            Conhecer projetos
          </Link>
        </section>
      </>
    );
  return (
    <>
      <section className="community-heading">
        <div>
          <div className="eyebrow">PROJETOS NEW</div>
          <h1>Uma ideia com caminho, orçamento e responsabilidade.</h1>
          <p>
            Projetos apresentados por seus responsáveis, com problema, orçamento,
            etapas e prestação de contas.
          </p>
        </div>
        <button className="primary" onClick={() => openProject()}>
          <Plus size={17} /> Apresentar projeto
        </button>
      </section>
      <div className="project-toolbar glass">
        <label className="search">
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar projeto, autor ou área"
            aria-label="Buscar projetos"
          />
        </label>
        <span>{visible.length} projetos</span>
      </div>
      {error && <div className="demo-banner error">{error}</div>}
      {loading && (
        <p role="status" className="community-loading">
          Carregando projetos…
        </p>
      )}
      <div className="real-project-grid">
        {visible.map((p) => (
          <article className="glass real-project-card" key={p.id}>
            <div className="project-card-top">
              <span className="type-label">
                {p.kind} · {p.area}
              </span>
              <span
                className={
                  p.status === "draft" ? "access-tag paid" : "access-tag"
                }
              >
                {p.status === "draft" ? "Rascunho" : p.stage}
              </span>
            </div>
            <h2>{p.title}</h2>
            <p>{p.problem}</p>
            <div className="project-owner">
              <span>{p.name}</span>
              <Link href={"/pessoas/" + p.authorSlug}>Ver perfil</Link>
            </div>
            <div className="project-money">
              <span>Orçamento estimado</span>
              <strong>{money(p.goalCents)}</strong>
            </div>
            {moneyOn && <Progress value={0} />}
            <div className="mini-meta">
              <span>{moneyOn ? "R$ 0 confirmados" : p.stage}</span>
              <span>{p.updateCount} atualizações</span>
            </div>
            <div className="actions">
              <button className="outline" onClick={() => setSelected(p)}>
                Ver projeto
              </button>
              {p.isMine && (
                <button className="textbutton" onClick={() => openProject(p)}>
                  Editar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!visible.length && !loading && (
        <div className="glass empty">
          <FileText />
          <h2>Nenhum projeto neste recorte.</h2>
          <p>
            Apresente uma proposta com problema, orçamento, etapas e riscos.
          </p>
          <button className="primary" onClick={() => openProject()}>
            Criar projeto
          </button>
        </div>
      )}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="project-dialog">
          <DialogTitle>{selected?.title}</DialogTitle>
          <DialogDescription>
            {selected?.kind} · {selected?.area} · responsável: {selected?.name}
          </DialogDescription>
          {selected && (
            <Tabs defaultValue="proposal">
              <TabsList className="view-tabs">
                <TabsTrigger value="proposal">Proposta</TabsTrigger>
                <TabsTrigger value="plan">Plano e orçamento</TabsTrigger>
                {moneyOn && <TabsTrigger value="rounds">Rodadas</TabsTrigger>}
                <TabsTrigger value="updates">Atualizações</TabsTrigger>
              </TabsList>
              <TabsContent value="proposal">
                <div className="project-detail">
                  <h3>Problema</h3>
                  <p>{selected.problem}</p>
                  <h3>Por que importa</h3>
                  <p>{selected.justification}</p>
                  <h3>Resultado esperado</h3>
                  <p>{selected.expectedResult}</p>
                  <div className="notice">
                    Conteúdo apresentado pelo responsável. Publicação na
                    comunidade não equivale a avaliação ou validação da Revista
                    NEW.
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="plan">
                <div className="project-detail">
                  <div className="project-money">
                    <span>Orçamento estimado</span>
                    <strong>{money(selected.goalCents)}</strong>
                  </div>
                  <h3>Orçamento declarado</h3>
                  <p>{selected.budget}</p>
                  <h3>Cronograma</h3>
                  <p>{selected.timeline}</p>
                  <h3>Equipe</h3>
                  <p>{selected.team}</p>
                  <h3>Riscos e limitações</h3>
                  <p>{selected.risks}</p>
                </div>
              </TabsContent>
              {moneyOn && (
              <TabsContent value="rounds">
                <div className="project-detail">
                  <p>
                    Cada rodada informa mínimo, meta e máximo. Em “tudo ou
                    nada”, o mínimo precisa ser alcançado; no modelo flexível, a
                    regra de uso deverá constar na prestação de contas.
                  </p>
                  {rounds
                    .filter((r) => r.projectId === selected.id)
                    .map((r) => (
                      <article className="round-card" key={r.id}>
                        <div>
                          <span>
                            RODADA {r.roundNumber} ·{" "}
                            {r.fundingModel === "all_or_nothing"
                              ? "TUDO OU NADA"
                              : "FLEXÍVEL"}
                          </span>
                          <h3>{r.title}</h3>
                          <p>{r.purpose}</p>
                        </div>
                        <div className="round-values">
                          <span>
                            <small>Mínimo</small>
                            <strong>{money(r.minimumCents)}</strong>
                          </span>
                          <span>
                            <small>Meta</small>
                            <strong>{money(r.targetCents)}</strong>
                          </span>
                          <span>
                            <small>Máximo</small>
                            <strong>{money(r.maximumCents)}</strong>
                          </span>
                        </div>
                        <h3>Entregas</h3>
                        <p>{r.deliverables}</p>
                      </article>
                    ))}
                  {!rounds.some((r) => r.projectId === selected.id) && (
                    <p>Nenhuma rodada definida.</p>
                  )}
                  {selected.isMine && (
                    <button
                      className="outline"
                      onClick={() => {
                        setConsent(false);
                        setRoundForm(true);
                      }}
                    >
                      <Plus size={15} /> Criar rodada
                    </button>
                  )}
                </div>
              </TabsContent>
              )}
              <TabsContent value="updates">
                <div className="project-detail">
                  {updates
                    .filter((u) => u.projectId === selected.id)
                    .map((u) => (
                      <article className="project-update" key={u.id}>
                        <span>
                          {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                        <h3>{u.title}</h3>
                        <p>{u.body}</p>
                      </article>
                    ))}
                  {!updates.some((u) => u.projectId === selected.id) && (
                    <p>Nenhuma atualização publicada.</p>
                  )}
                  {selected.isMine && (
                    <button
                      className="outline"
                      onClick={() => {
                        setConsent(false);
                        setUpdateForm(true);
                      }}
                    >
                      <Plus size={15} /> Publicar atualização
                    </button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
          {moneyOn && (
            <button className="primary full" disabled onClick={() => {}}>
              Apoio financeiro em preparação
            </button>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={form} onOpenChange={(v) => !saving && setForm(v)}>
        <DialogContent className="submission-dialog project-form-dialog">
          <DialogTitle>
            {editing ? "Editar projeto" : "Apresentar projeto"}
          </DialogTitle>
          <DialogDescription>
            O responsável declara os dados. A NEW não confirma resultados,
            orçamento ou viabilidade apenas pela publicação.
          </DialogDescription>
          <form className="submission-form" onSubmit={saveProject}>
            <div className="two-grid">
              <label className="field">
                Título
                <input
                  name="title"
                  required
                  minLength={5}
                  maxLength={180}
                  defaultValue={editing?.title}
                />
              </label>
              <label className="field">
                Endereço
                <input
                  name="slug"
                  required
                  pattern="[a-z][a-z0-9-]{2,59}"
                  defaultValue={editing?.slug}
                  placeholder="nome-do-projeto"
                />
              </label>
            </div>
            <div className="two-grid">
              <label className="field">
                Tipo
                <Select name="kind" defaultValue={editing?.kind || "Pesquisa"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kinds.map((x) => (
                      <SelectItem value={x} key={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="field">
                Estágio
                <Select name="stage" defaultValue={editing?.stage || "Ideia"}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((x) => (
                      <SelectItem value={x} key={x}>
                        {x}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <label className="field">
              Área
              <input
                name="area"
                required
                minLength={2}
                maxLength={80}
                defaultValue={editing?.area}
              />
            </label>
            <label className="field">
              Problema
              <textarea
                name="problem"
                required
                minLength={30}
                maxLength={3000}
                rows={4}
                defaultValue={editing?.problem}
              />
            </label>
            <label className="field">
              Justificativa
              <textarea
                name="justification"
                required
                minLength={30}
                maxLength={3000}
                rows={4}
                defaultValue={editing?.justification}
              />
            </label>
            <label className="field">
              Resultado esperado
              <textarea
                name="expectedResult"
                required
                minLength={20}
                maxLength={2000}
                rows={3}
                defaultValue={editing?.expectedResult}
              />
            </label>
            <label className="field">
              Orçamento total estimado (R$)
              <input
                name="goal"
                type="number"
                min="1"
                max="1000000"
                step="0.01"
                required
                defaultValue={(editing?.goalCents || 2000000) / 100}
              />
            </label>
            <label className="field">
              Orçamento detalhado
              <textarea
                name="budget"
                required
                minLength={20}
                maxLength={4000}
                rows={4}
                defaultValue={editing?.budget}
              />
            </label>
            <label className="field">
              Cronograma e etapas
              <textarea
                name="timeline"
                required
                minLength={20}
                maxLength={3000}
                rows={4}
                defaultValue={editing?.timeline}
              />
            </label>
            <label className="field">
              Equipe responsável
              <textarea
                name="team"
                required
                minLength={2}
                maxLength={2000}
                rows={3}
                defaultValue={editing?.team}
              />
            </label>
            <label className="field">
              Riscos e limitações
              <textarea
                name="risks"
                required
                minLength={20}
                maxLength={3000}
                rows={3}
                defaultValue={editing?.risks}
              />
            </label>
            <label className="consent">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
              />
              Declaro que as informações são de responsabilidade do projeto e
              autorizo sua exibição pública.
            </label>
            {formError && (
              <p className="error" role="alert">
                {formError}
              </p>
            )}
            <div className="actions">
              <button
                className="outline"
                name="intent"
                value="draft"
                disabled={!consent || saving}
              >
                Salvar rascunho
              </button>
              <button
                className="primary"
                name="intent"
                value="published"
                disabled={!consent || saving}
              >
                {saving ? "Salvando…" : "Publicar projeto"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={updateForm}
        onOpenChange={(v) => !saving && setUpdateForm(v)}
      >
        <DialogContent className="submission-dialog">
          <DialogTitle>Atualizar projeto</DialogTitle>
          <DialogDescription>
            Registre avanços, mudanças, dificuldades ou prestação de contas.
          </DialogDescription>
          <form className="submission-form" onSubmit={saveUpdate}>
            <label className="field">
              Título
              <input name="title" required minLength={5} maxLength={140} />
            </label>
            <label className="field">
              Atualização
              <textarea
                name="body"
                required
                minLength={30}
                maxLength={6000}
                rows={8}
              />
            </label>
            <label className="consent">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
              />
              Confirmo que esta atualização integra o histórico público do
              projeto.
            </label>
            {formError && <p className="error">{formError}</p>}
            <button className="primary full" disabled={!consent || saving}>
              {saving ? "Publicando…" : "Publicar atualização"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
      {moneyOn && (
      <Dialog open={roundForm} onOpenChange={(v) => !saving && setRoundForm(v)}>
        <DialogContent className="submission-dialog project-form-dialog">
          <DialogTitle>Nova rodada de financiamento</DialogTitle>
          <DialogDescription>
            Defina limites e entregas. Nenhuma cobrança é feita nesta versão.
          </DialogDescription>
          <form className="submission-form" onSubmit={saveRound}>
            <div className="two-grid">
              <label className="field">
                Número da rodada
                <input
                  name="roundNumber"
                  type="number"
                  min="1"
                  max="20"
                  required
                  defaultValue={
                    rounds.filter((r) => r.projectId === selected?.id).length +
                    1
                  }
                />
              </label>
              <label className="field">
                Modelo
                <Select name="fundingModel" defaultValue="all_or_nothing">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_or_nothing">Tudo ou nada</SelectItem>
                    <SelectItem value="flexible">Flexível</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>
            <label className="field">
              Título
              <input name="title" required minLength={5} maxLength={160} />
            </label>
            <div className="three-grid">
              <label className="field">
                Mínimo (R$)
                <input
                  name="minimum"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                />
              </label>
              <label className="field">
                Meta (R$)
                <input
                  name="target"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                />
              </label>
              <label className="field">
                Máximo (R$)
                <input
                  name="maximum"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                />
              </label>
            </div>
            <label className="field">
              Uso dos recursos
              <textarea
                name="purpose"
                required
                minLength={20}
                maxLength={3000}
                rows={4}
              />
            </label>
            <label className="field">
              Entregas da rodada
              <textarea
                name="deliverables"
                required
                minLength={20}
                maxLength={3000}
                rows={4}
              />
            </label>
            <label className="consent">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
              />
              Confirmo que mínimo ≤ meta ≤ máximo e assumo a prestação de
              contas.
            </label>
            {formError && <p className="error">{formError}</p>}
            <div className="actions">
              <button
                className="outline"
                value="draft"
                disabled={!consent || saving}
              >
                Salvar rascunho
              </button>
              <button
                className="primary"
                value="ready"
                disabled={!consent || saving}
              >
                Exibir rodada
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      )}
    </>
  );
}
