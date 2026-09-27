"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PortfolioItem, PortfolioKind } from "../../lib/content";
import { createClient } from "../../lib/supabase/client";

const blankItem = (): PortfolioItem => ({
  kind: "photo",
  title: "",
  title_ar: "",
  subtitle: "",
  description: "",
  category: "",
  cover_url: "",
  video_url: "",
  external_url: "",
  year: "",
  duration: "",
  tags: [],
  sort_order: 0,
  is_featured: false,
  is_published: true,
});

export function AdminDashboard({ initialItems }: { initialItems: PortfolioItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<PortfolioItem>(initialItems[0] ?? blankItem());
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<PortfolioKind | "all">("all");
  const supabase = useMemo(() => createClient(), []);

  const visibleItems = filter === "all" ? items : items.filter((item) => item.kind === filter);

  function patch<K extends keyof PortfolioItem>(key: K, value: PortfolioItem[K]) {
    setSelected((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!selected.title.trim()) {
      setStatus("Add a title first.");
      return;
    }
    setBusy(true);
    setStatus("");
    const payload = {
      kind: selected.kind,
      title: selected.title.trim(),
      title_ar: selected.title_ar?.trim() || null,
      subtitle: selected.subtitle?.trim() || null,
      description: selected.description?.trim() || null,
      category: selected.category?.trim() || null,
      cover_url: selected.cover_url?.trim() || null,
      video_url: selected.video_url?.trim() || null,
      external_url: selected.external_url?.trim() || null,
      year: selected.year?.trim() || null,
      duration: selected.duration?.trim() || null,
      tags: selected.tags ?? [],
      sort_order: Number(selected.sort_order ?? 0),
      is_featured: Boolean(selected.is_featured),
      is_published: Boolean(selected.is_published),
    };

    if (selected.id) {
      const { data, error } = await supabase.from("portfolio_items").update(payload).eq("id", selected.id).select().single();
      if (error) setStatus(error.message);
      else {
        setItems((current) => current.map((item) => item.id === selected.id ? (data as PortfolioItem) : item));
        setSelected(data as PortfolioItem);
        setStatus("Saved.");
      }
    } else {
      const { data, error } = await supabase.from("portfolio_items").insert(payload).select().single();
      if (error) setStatus(error.message);
      else {
        setItems((current) => [...current, data as PortfolioItem]);
        setSelected(data as PortfolioItem);
        setStatus("Created.");
      }
    }
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!selected.id || !window.confirm(`Delete “${selected.title}”?`)) return;
    setBusy(true);
    const { error } = await supabase.from("portfolio_items").delete().eq("id", selected.id);
    setBusy(false);
    if (error) {
      setStatus(error.message);
      return;
    }
    const next = items.filter((item) => item.id !== selected.id);
    setItems(next);
    setSelected(next[0] ?? blankItem());
    setStatus("Deleted.");
    router.refresh();
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setStatus("Uploading…");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setStatus("Your session expired. Sign in again.");
      setBusy(false);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const safeName = `${crypto.randomUUID()}.${ext}`;
    const path = `${user.id}/${safeName}`;
    const { error } = await supabase.storage.from("portfolio-media").upload(path, file, { upsert: false, cacheControl: "3600" });
    if (error) {
      setStatus(error.message);
      setBusy(false);
      return;
    }
    const { data } = supabase.storage.from("portfolio-media").getPublicUrl(path);
    patch("cover_url", data.publicUrl);
    setStatus("Media uploaded. Press Save to attach it to this item.");
    setBusy(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <main className="adminPage">
      <aside className="adminSidebar">
        <a href="/" className="adminBrand"><span className="brandMark">R</span><span><strong>Rover</strong><small>Portfolio Admin</small></span></a>
        <nav className="adminNav">
          {(["all", "photo", "film", "application", "creative"] as const).map((kind) => (
            <button key={kind} className={filter === kind ? "active" : ""} onClick={() => setFilter(kind)}>{kind === "all" ? "All projects" : kind}</button>
          ))}
        </nav>
        <div className="adminSidebarBottom"><a href="/" target="_blank">Open website ↗</a><button onClick={signOut}>Sign out</button></div>
      </aside>

      <section className="adminWorkspace">
        <header className="adminTopbar"><div><p className="adminKicker">CONTENT STUDIO</p><h1>Portfolio Manager</h1></div><button className="adminPrimary" onClick={() => { setSelected(blankItem()); setStatus(""); }}>+ Add new</button></header>
        <div className="adminColumns">
          <div className="adminListPanel">
            <div className="adminListHead"><strong>{visibleItems.length} items</strong><span>{filter}</span></div>
            <div className="adminItems">
              {visibleItems.map((item) => <button key={item.id} className={selected.id === item.id ? "adminItem active" : "adminItem"} onClick={() => { setSelected(item); setStatus(""); }}>
                <span className="adminThumb">{item.cover_url ? <img src={item.cover_url} alt=""/> : item.title.slice(0,1)}</span>
                <span className="adminItemText"><strong>{item.title}</strong><small>{item.kind} · {item.is_published ? "Published" : "Draft"}</small></span>
              </button>)}
              {!visibleItems.length && <p className="adminEmpty">No items in this section yet.</p>}
            </div>
          </div>

          <div className="adminEditor">
            <div className="adminEditorHead"><div><p className="adminKicker">{selected.id ? "EDIT ITEM" : "NEW ITEM"}</p><h2>{selected.title || "Untitled project"}</h2></div><div className="adminEditorActions">{selected.id && <button className="adminDanger" onClick={remove} disabled={busy}>Delete</button>}<button className="adminPrimary" onClick={save} disabled={busy}>{busy ? "Working…" : "Save changes"}</button></div></div>

            <div className="adminFormGrid">
              <label>Type<select value={selected.kind} onChange={(e) => patch("kind", e.target.value as PortfolioKind)}><option value="photo">Photography</option><option value="film">Film / Documentary</option><option value="application">Application / Project</option><option value="creative">Creative work</option></select></label>
              <label>Sort order<input type="number" value={selected.sort_order ?? 0} onChange={(e) => patch("sort_order", Number(e.target.value))}/></label>
              <label className="span2">English title<input value={selected.title} onChange={(e) => patch("title", e.target.value)} /></label>
              <label className="span2">Arabic title<input dir="rtl" value={selected.title_ar ?? ""} onChange={(e) => patch("title_ar", e.target.value)} /></label>
              <label>Subtitle / project type<input value={selected.subtitle ?? ""} onChange={(e) => patch("subtitle", e.target.value)} placeholder="Flutter App" /></label>
              <label>Category<input value={selected.category ?? ""} onChange={(e) => patch("category", e.target.value)} placeholder="People, Urban, Design…" /></label>
              <label>Year<input value={selected.year ?? ""} onChange={(e) => patch("year", e.target.value)} /></label>
              <label>Duration<input value={selected.duration ?? ""} onChange={(e) => patch("duration", e.target.value)} placeholder="18 min" /></label>
              <label className="span2">Description<textarea value={selected.description ?? ""} onChange={(e) => patch("description", e.target.value)} rows={5} /></label>
              <label className="span2">Tags<input value={(selected.tags ?? []).join(", ")} onChange={(e) => patch("tags", e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} placeholder="Flutter, Supabase, AI" /></label>
              <label className="span2">Cover / media URL<input value={selected.cover_url ?? ""} onChange={(e) => patch("cover_url", e.target.value)} /></label>
              <label className="span2 uploadBox">Upload image or media<input type="file" accept="image/*" onChange={upload} disabled={busy}/><span>Choose a cover image from your device</span></label>
              <label className="span2">Video URL<input value={selected.video_url ?? ""} onChange={(e) => patch("video_url", e.target.value)} placeholder="YouTube / Vimeo / direct link" /></label>
              <label className="span2">Project / external URL<input value={selected.external_url ?? ""} onChange={(e) => patch("external_url", e.target.value)} /></label>
            </div>

            <div className="adminChecks">
              <label><input type="checkbox" checked={Boolean(selected.is_published)} onChange={(e) => patch("is_published", e.target.checked)} /> Published</label>
              <label><input type="checkbox" checked={Boolean(selected.is_featured)} onChange={(e) => patch("is_featured", e.target.checked)} /> Featured</label>
            </div>

            {selected.cover_url && <div className="adminPreview" style={{ backgroundImage: `url('${selected.cover_url}')` }}><span>Cover preview</span></div>}
            {status && <p className="adminStatus">{status}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
