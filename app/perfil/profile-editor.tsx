"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronDown, Loader2, MapPin, ExternalLink, X } from "lucide-react";
import { INTEREST_SUGGESTIONS, LIMITS, SLUG_RE, profileErrors, slugFromName, type ProfileForm } from "@/lib/profile-validation";

type SlugState = "idle" | "checking" | "ok" | "taken" | "invalid";
export type InitialProfile = ProfileForm & { exists: boolean; showSupporters: boolean };

export default function ProfileEditor({ initial, next }: { initial: InitialProfile; next: string }) {
  const router = useRouter();
  const [f, setF] = useState<ProfileForm>(initial);
  const [consent, setConsent] = useState(initial.exists);
  const [slugTouched, setSlugTouched] = useState(initial.exists);
  const [slugState, setSlugState] = useState<SlugState>(initial.exists ? "ok" : "idle");
  const [showMore, setShowMore] = useState(!!(initial.location || initial.link || initial.trajectory));
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [custom, setCustom] = useState("");
  const dirty = useRef(false);

  const errors = useMemo(() => profileErrors(f), [f]);
  const slugBad = slugState === "taken" || slugState === "invalid";
  const canSave = Object.keys(errors).length === 0 && consent && !slugBad && slugState !== "checking";

  function set<K extends keyof ProfileForm>(k: K, v: ProfileForm[K]) {
    dirty.current = true;
    setF((p) => ({ ...p, [k]: v }));
  }

  function onName(v: string) {
    dirty.current = true;
    setF((p) => ({ ...p, name: v, slug: slugTouched ? p.slug : slugFromName(v) }));
  }

  // Disponibilidade do endereço (com pequena espera enquanto a pessoa digita).
  useEffect(() => {
    if (initial.exists && f.slug === initial.slug) return;
    const slug = f.slug;
    const t = setTimeout(async () => {
      if (!SLUG_RE.test(slug)) return setSlugState(slug ? "invalid" : "idle");
      setSlugState("checking");
      try {
        const r = await fetch(`/api/community/slug?slug=${encodeURIComponent(slug)}`);
        const d = (await r.json()) as { available?: boolean };
        setSlugState(d.available ? "ok" : "taken");
      } catch {
        setSlugState("idle");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [f.slug, initial.exists, initial.slug]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  function toggleInterest(x: string) {
    const has = f.interests.some((i) => i.toLowerCase() === x.toLowerCase());
    set("interests", has ? f.interests.filter((i) => i.toLowerCase() !== x.toLowerCase()) : [...f.interests, x]);
  }
  function addCustom() {
    const v = custom.trim().replace(/,+$/, "");
    if (v && !f.interests.some((i) => i.toLowerCase() === v.toLowerCase())) set("interests", [...f.interests, v.slice(0, 40)]);
    setCustom("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setServerError("");
    if (!canSave) {
      document.querySelector(".pf-field.bad, .pf-consent.bad")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSaving(true);
    try {
      const r = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile",
          name: f.name.trim(),
          slug: f.slug,
          headline: f.headline.trim(),
          location: f.location.trim(),
          bio: f.bio.trim(),
          trajectory: f.trajectory.trim(),
          interests: f.interests.join(", "),
          link: f.link.trim(),
          showSupporters: initial.showSupporters,
          consent: true,
        }),
      });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error || "Não foi possível salvar.");
      dirty.current = false;
      toast.success(initial.exists ? "Perfil atualizado." : "Perfil criado! Agora é só escrever.");
      router.push(next);
      router.refresh();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Não foi possível salvar.");
      setSaving(false);
    }
  }

  const bad = (k: keyof ProfileForm) => tried && errors[k];
  const initialLetter = (f.name.trim() || "?").slice(0, 1).toUpperCase();

  return (
    <div className="writer pf-page">
      <header className="writer-bar">
        <Link
          href={initial.exists ? "/caderno" : "/"}
          className="writer-back"
          onClick={(e) => {
            if (dirty.current && !window.confirm("Há alterações não salvas. Sair mesmo assim?")) e.preventDefault();
          }}
        >
          <ArrowLeft size={16} /> {initial.exists ? "Meu Caderno" : "Voltar"}
        </Link>
        <span className="writer-brand">Revista NEW<i>.</i></span>
        <span className="writer-spacer" />
        <button className="writer-btn primary" form="pf-form" disabled={saving}>
          {saving ? "Salvando…" : initial.exists ? "Salvar alterações" : "Criar meu perfil"}
        </button>
      </header>

      <main className="pf">
        <div className="pf-intro">
          <div className="eyebrow">{initial.exists ? "EDITAR PERFIL" : "BEM-VINDO(A) À REVISTA NEW"}</div>
          <h1>{initial.exists ? "Seu perfil" : "Vamos criar o seu perfil"}</h1>
          <p>É assim que as pessoas vão te conhecer. Leva um minuto, e você pode mudar tudo depois.</p>
        </div>

        <div className="pf-grid">
          <form id="pf-form" className="pf-form" onSubmit={save} noValidate>
            <section className="pf-card">
              <h2>Quem é você</h2>

              <label className={"pf-field" + (bad("name") ? " bad" : "")}>
                <span>Nome público</span>
                <input value={f.name} maxLength={LIMITS.name[1]} autoFocus placeholder="Como você quer ser conhecido" onChange={(e) => onName(e.target.value)} />
                {bad("name") && <small className="pf-err">{errors.name}</small>}
              </label>

              <label className={"pf-field" + (bad("slug") || slugBad ? " bad" : "")}>
                <span>Endereço do seu perfil</span>
                <div className="pf-slug">
                  <i>revista.newflowsys.cloud/pessoas/</i>
                  <input
                    value={f.slug}
                    maxLength={40}
                    placeholder="seu-nome"
                    onChange={(e) => {
                      setSlugTouched(true);
                      set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                    }}
                  />
                  <b className={"pf-slug-state " + slugState}>
                    {slugState === "checking" && <Loader2 size={14} className="spin" />}
                    {slugState === "ok" && <Check size={14} />}
                    {(slugState === "taken" || slugState === "invalid") && <X size={14} />}
                  </b>
                </div>
                <small className={slugBad || bad("slug") ? "pf-err" : "pf-hint"}>
                  {slugState === "taken" ? "Esse endereço já está em uso. Tente outro." : bad("slug") || slugState === "invalid" ? errors.slug ?? "Endereço inválido." : slugState === "ok" ? "Disponível!" : "Gerado a partir do seu nome; você pode editar."}
                </small>
              </label>

              <label className="pf-field">
                <span>Frase de apresentação <em>opcional</em></span>
                <input value={f.headline} maxLength={LIMITS.headline} placeholder="Pesquisador, escritor, criador…" onChange={(e) => set("headline", e.target.value)} />
              </label>
            </section>

            <section className="pf-card">
              <h2>Sobre você</h2>

              <label className={"pf-field" + (bad("bio") ? " bad" : "")}>
                <span>Conte, em poucas linhas, o que você estuda, cria ou investiga</span>
                <textarea rows={5} value={f.bio} maxLength={LIMITS.bio[1]} placeholder="Ex.: Estudo como a atenção muda a forma como aprendemos e escrevo sobre isso aqui." onChange={(e) => set("bio", e.target.value)} />
                <small className={bad("bio") ? "pf-err" : "pf-hint"}>
                  {bad("bio") ? errors.bio : `${f.bio.trim().length}/${LIMITS.bio[1]}`}
                </small>
              </label>

              <div className={"pf-field" + (bad("interests") ? " bad" : "")}>
                <span>Seus interesses</span>
                <div className="pf-chips">
                  {INTEREST_SUGGESTIONS.map((x) => (
                    <button type="button" key={x} className={f.interests.some((i) => i.toLowerCase() === x.toLowerCase()) ? "on" : ""} aria-pressed={f.interests.some((i) => i.toLowerCase() === x.toLowerCase())} onClick={() => toggleInterest(x)}>
                      {x}
                    </button>
                  ))}
                  {f.interests
                    .filter((i) => !INTEREST_SUGGESTIONS.some((s) => s.toLowerCase() === i.toLowerCase()))
                    .map((x) => (
                      <button type="button" key={x} className="on" aria-pressed="true" onClick={() => toggleInterest(x)}>
                        {x} <X size={12} />
                      </button>
                    ))}
                </div>
                <input
                  className="pf-add"
                  value={custom}
                  maxLength={40}
                  placeholder="Outro interesse… (Enter para adicionar)"
                  onChange={(e) => (e.target.value.endsWith(",") ? (setCustom(e.target.value), addCustom()) : setCustom(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustom();
                    }
                  }}
                  onBlur={addCustom}
                />
                {bad("interests") && <small className="pf-err">{errors.interests}</small>}
              </div>
            </section>

            <section className="pf-card">
              <button type="button" className="pf-more" aria-expanded={showMore} onClick={() => setShowMore((v) => !v)}>
                <span>
                  <h2>Mais sobre você</h2>
                  <small>Opcional: onde você está, seu link e sua trajetória</small>
                </span>
                <ChevronDown size={20} className={showMore ? "open" : ""} />
              </button>
              {showMore && (
                <div className="pf-more-body">
                  <div className="pf-two">
                    <label className="pf-field">
                      <span>Cidade</span>
                      <input value={f.location} maxLength={LIMITS.location} placeholder="Jundiaí, SP" onChange={(e) => set("location", e.target.value)} />
                    </label>
                    <label className={"pf-field" + (bad("link") ? " bad" : "")}>
                      <span>Link externo</span>
                      <input value={f.link} maxLength={LIMITS.link} placeholder="https://instagram.com/…" inputMode="url" onChange={(e) => set("link", e.target.value)} />
                      {bad("link") && <small className="pf-err">{errors.link}</small>}
                    </label>
                  </div>
                  <label className="pf-field">
                    <span>Trajetória intelectual</span>
                    <textarea rows={6} value={f.trajectory} maxLength={LIMITS.trajectory} placeholder="Sua formação, mudanças de interesse, projetos e as perguntas que orientam o seu trabalho." onChange={(e) => set("trajectory", e.target.value)} />
                  </label>
                </div>
              )}
            </section>

            <label className={"pf-consent" + (tried && !consent ? " bad" : "")}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>
                Autorizo a exibição pública deste perfil. Entendo que criar um perfil não significa aprovação editorial nem selo da NEW.
              </span>
            </label>

            {serverError && <p role="alert" className="pf-server-err">{serverError}</p>}

            <div className="pf-actions">
              <button className="primary" disabled={saving}>
                {saving ? "Salvando…" : initial.exists ? "Salvar alterações" : "Criar meu perfil"}
              </button>
              {tried && !canSave && !saving && <small className="pf-err">Falta preencher alguns campos acima.</small>}
            </div>
          </form>

          <aside className="pf-preview" aria-label="Pré-visualização">
            <div className="pf-preview-label">Como as pessoas vão ver</div>
            <div className="pf-card pf-pcard">
              <span className="pf-avatar">{initialLetter}</span>
              <div className="eyebrow">AUTOR INDEPENDENTE</div>
              <h3>{f.name.trim() || "Seu nome"}</h3>
              {f.headline.trim() && <p className="pf-p-head">{f.headline.trim()}</p>}
              {f.location.trim() && (
                <p className="pf-p-loc"><MapPin size={13} /> {f.location.trim()}</p>
              )}
              <p className={f.bio.trim() ? "pf-p-bio" : "pf-p-bio empty"}>{f.bio.trim() || "Sua apresentação aparece aqui conforme você escreve."}</p>
              {f.interests.length > 0 && (
                <div className="pf-p-tags">
                  {f.interests.map((i) => (
                    <span key={i}>{i}</span>
                  ))}
                </div>
              )}
              {f.link.trim() && !errors.link && (
                <p className="pf-p-link"><ExternalLink size={13} /> {f.link.trim().replace(/^https:\/\//, "")}</p>
              )}
              <div className="pf-p-url">/pessoas/{f.slug || "seu-nome"}</div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
