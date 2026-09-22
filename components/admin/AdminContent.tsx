"use client";

import { useEffect, useState } from "react";
import { FileEdit, Plus, Trash2, ExternalLink, ImagePlus } from "lucide-react";
import AdminShell from "./AdminShell";
import type {
  SiteContent,
  HeroContent,
  StatItem,
  OfficesContent,
  OfficeItem,
  ProfileContent,
  ContactsContent,
  ContactItem,
  FooterContent,
  SocialLinks,
  GalleryContent,
} from "@/lib/content";

type Notice = { type: "success" | "error"; msg: string } | null;

function NoticeText({ notice }: { notice: Notice }) {
  if (!notice) return null;
  return (
    <p className={`mt-3 text-xs ${notice.type === "success" ? "text-teal" : "text-signal"}`}>{notice.msg}</p>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-ink/50">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-royal"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-line bg-white px-3 py-2 text-sm focus:border-royal"
        />
      )}
    </label>
  );
}

function CardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center bg-royal/10 text-royal">
        <FileEdit size={15} />
      </span>
      <div>
        <p className="font-display text-sm font-semibold">{title}</p>
        <p className="text-xs text-ink/50">{subtitle}</p>
      </div>
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="mt-4 border border-ink bg-ink px-5 py-2.5 font-mono text-[11px] uppercase tracking-wider text-paper transition-colors hover:bg-royal hover:border-royal disabled:cursor-not-allowed disabled:opacity-60"
    >
      {saving ? "Saving…" : "Save"}
    </button>
  );
}

export default function AdminContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [hero, setHero] = useState<HeroContent | null>(null);
  const [heroSaving, setHeroSaving] = useState(false);
  const [heroNotice, setHeroNotice] = useState<Notice>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageNotice, setImageNotice] = useState<Notice>(null);

  const [stats, setStats] = useState<StatItem[] | null>(null);
  const [statsSaving, setStatsSaving] = useState(false);
  const [statsNotice, setStatsNotice] = useState<Notice>(null);

  const [offices, setOffices] = useState<OfficesContent | null>(null);
  const [officesSaving, setOfficesSaving] = useState(false);
  const [officesNotice, setOfficesNotice] = useState<Notice>(null);

  const [profile, setProfile] = useState<ProfileContent | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileNotice, setProfileNotice] = useState<Notice>(null);

  const [contacts, setContacts] = useState<ContactsContent | null>(null);
  const [contactsSaving, setContactsSaving] = useState(false);
  const [contactsNotice, setContactsNotice] = useState<Notice>(null);

  const [footer, setFooter] = useState<FooterContent | null>(null);
  const [footerSaving, setFooterSaving] = useState(false);
  const [footerNotice, setFooterNotice] = useState<Notice>(null);

  const [social, setSocial] = useState<SocialLinks | null>(null);
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialNotice, setSocialNotice] = useState<Notice>(null);

  const [gallery, setGallery] = useState<GalleryContent | null>(null);
  const [gallerySaving, setGallerySaving] = useState(false);
  const [galleryNotice, setGalleryNotice] = useState<Notice>(null);
  const [galleryUploading, setGalleryUploading] = useState(false);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/admin/content", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load content.");
      const c: SiteContent = data.content;
      setContent(c);
      setHero(c.hero);
      setStats(c.stats);
      setOffices(c.offices);
      setProfile(c.profile);
      setContacts(c.contacts);
      setFooter(c.footer);
      setSocial(c.social);
      setGallery(c.gallery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load content.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveBlock(
    key: keyof SiteContent,
    value: unknown,
    setSaving: (v: boolean) => void,
    setNotice: (v: Notice) => void
  ) {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      setContent(data.content);
      setNotice({ type: "success", msg: "Saved — live on the homepage now." });
    } catch (err) {
      setNotice({ type: "error", msg: err instanceof Error ? err.message : "Failed to save." });
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    setImageUploading(true);
    setImageNotice(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/content/hero-image", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to upload image.");
      setContent(data.content);
      setHero(data.content.hero);
      setImageNotice({ type: "success", msg: "Hero image updated — live on the homepage now." });
    } catch (err) {
      setImageNotice({ type: "error", msg: err instanceof Error ? err.message : "Failed to upload image." });
    } finally {
      setImageUploading(false);
    }
  }

  async function handleImageRemove() {
    setImageUploading(true);
    setImageNotice(null);
    try {
      const res = await fetch("/api/admin/content/hero-image", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove image.");
      setContent(data.content);
      setHero(data.content.hero);
      setImageNotice({ type: "success", msg: "Reverted to the default illustration." });
    } catch (err) {
      setImageNotice({ type: "error", msg: err instanceof Error ? err.message : "Failed to remove image." });
    } finally {
      setImageUploading(false);
    }
  }

  async function handleGalleryUpload(files: FileList) {
    setGalleryUploading(true);
    setGalleryNotice(null);
    try {
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/admin/content/gallery-image", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `Failed to upload ${file.name}.`);
        setContent(data.content);
        setGallery(data.content.gallery);
      }
      setGalleryNotice({ type: "success", msg: "Photo(s) added — live on the gallery page now." });
    } catch (err) {
      setGalleryNotice({ type: "error", msg: err instanceof Error ? err.message : "Failed to upload photo." });
    } finally {
      setGalleryUploading(false);
    }
  }

  async function handleGalleryDelete(path: string) {
    setGalleryUploading(true);
    setGalleryNotice(null);
    try {
      const res = await fetch("/api/admin/content/gallery-image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove photo.");
      setContent(data.content);
      setGallery(data.content.gallery);
      setGalleryNotice({ type: "success", msg: "Photo removed." });
    } catch (err) {
      setGalleryNotice({ type: "error", msg: err instanceof Error ? err.message : "Failed to remove photo." });
    } finally {
      setGalleryUploading(false);
    }
  }

  return (
    <AdminShell active="content" eyebrow="Operations" title="Content">
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-ink/50">Edits here go live on the public homepage immediately.</p>
        <a
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-royal hover:underline"
        >
          View homepage <ExternalLink size={12} />
        </a>
      </div>

      {error && (
        <p className="mb-6 border border-signal/40 bg-signal/5 px-4 py-3 text-sm text-ink">{error}</p>
      )}

      {!content || !hero || !stats || !offices || !profile || !contacts || !footer || !social || !gallery ? (
        <p className="text-sm text-ink/50">Loading content…</p>
      ) : (
        <div className="space-y-6">
          {/* Hero */}
          <div className="border border-line bg-white p-6">
            <CardHeader title="Hero" subtitle="The big headline and buttons at the top of the homepage." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Headline — line 1" value={hero.headline1} onChange={(v) => setHero({ ...hero, headline1: v })} />
              <Field label="Headline — line 2" value={hero.headline2} onChange={(v) => setHero({ ...hero, headline2: v })} />
              <div className="sm:col-span-2">
                <Field label="Subheadline" value={hero.subheadline} onChange={(v) => setHero({ ...hero, subheadline: v })} textarea />
              </div>
              <Field label="Primary button label" value={hero.ctaPrimary} onChange={(v) => setHero({ ...hero, ctaPrimary: v })} />
              <Field label="Secondary button label" value={hero.ctaSecondary} onChange={(v) => setHero({ ...hero, ctaSecondary: v })} />
            </div>
            <SaveButton saving={heroSaving} onClick={() => saveBlock("hero", hero, setHeroSaving, setHeroNotice)} />
            <NoticeText notice={heroNotice} />

            <div className="mt-6 border-t border-line pt-5">
              <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Background photo
              </span>
              <p className="mb-3 text-[11px] text-ink/40">
                Replaces the default illustration behind the headline. JPG, PNG, WEBP or GIF, up to 8MB.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <div className="h-20 w-32 shrink-0 overflow-hidden border border-line bg-ink">
                  {hero.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={hero.imageUrl} alt="Current hero background" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-paper/40">
                      Default illustration
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer border border-line px-4 py-2 text-center font-mono text-[11px] uppercase tracking-wider text-ink/70 hover:border-ink hover:text-ink">
                    {imageUploading ? "Uploading…" : hero.imageUrl ? "Replace image" : "Upload image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      disabled={imageUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        e.target.value = "";
                      }}
                      className="hidden"
                    />
                  </label>
                  {hero.imageUrl && (
                    <button
                      onClick={handleImageRemove}
                      disabled={imageUploading}
                      className="font-mono text-[11px] uppercase tracking-wide text-signal hover:underline disabled:opacity-50"
                    >
                      Remove — use default illustration
                    </button>
                  )}
                </div>
              </div>
              <NoticeText notice={imageNotice} />
            </div>
          </div>

          {/* Stats */}
          <div className="border border-line bg-white p-6">
            <CardHeader title="Stats bar" subtitle="The four highlight numbers under the hero." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="space-y-2 border border-line bg-paper p-3">
                  <Field
                    label="Value"
                    value={s.value}
                    onChange={(v) => setStats(stats.map((x, j) => (j === i ? { ...x, value: v } : x)))}
                  />
                  <Field
                    label="Label"
                    value={s.label}
                    onChange={(v) => setStats(stats.map((x, j) => (j === i ? { ...x, label: v } : x)))}
                  />
                </div>
              ))}
            </div>
            <SaveButton saving={statsSaving} onClick={() => saveBlock("stats", stats, setStatsSaving, setStatsNotice)} />
            <NoticeText notice={statsNotice} />
          </div>

          {/* Offices */}
          <div className="border border-line bg-white p-6">
            <CardHeader title="Office network" subtitle="Section heading and the list of office cards." />
            <div className="mt-5">
              <Field label="Section heading" value={offices.heading} onChange={(v) => setOffices({ ...offices, heading: v })} />
            </div>
            <div className="mt-4 space-y-4">
              {offices.offices.map((o, i) => (
                <div key={i} className="border border-line bg-paper p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-ink/40">Office {i + 1}</span>
                    <button
                      onClick={() => setOffices({ ...offices, offices: offices.offices.filter((_, j) => j !== i) })}
                      className="text-ink/40 hover:text-signal"
                      title="Remove office"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Name"
                      value={o.name}
                      onChange={(v) => {
                        const next = [...offices.offices];
                        next[i] = { ...o, name: v };
                        setOffices({ ...offices, offices: next });
                      }}
                    />
                    <Field
                      label="Address (one line per row)"
                      value={o.lines.join("\n")}
                      onChange={(v) => {
                        const next = [...offices.offices];
                        next[i] = { ...o, lines: v.split("\n") };
                        setOffices({ ...offices, offices: next });
                      }}
                      textarea
                    />
                    <Field
                      label="Phone"
                      value={o.phone}
                      onChange={(v) => {
                        const next = [...offices.offices];
                        next[i] = { ...o, phone: v };
                        setOffices({ ...offices, offices: next });
                      }}
                    />
                    <Field
                      label="Email / contact"
                      value={o.email}
                      onChange={(v) => {
                        const next = [...offices.offices];
                        next[i] = { ...o, email: v };
                        setOffices({ ...offices, offices: next });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setOffices({
                  ...offices,
                  offices: [...offices.offices, { name: "New office", lines: [""], phone: "", email: "" }],
                })
              }
              className="mt-3 flex items-center gap-1.5 border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink/60 hover:border-ink hover:text-ink"
            >
              <Plus size={13} /> Add office
            </button>
            <div>
              <SaveButton saving={officesSaving} onClick={() => saveBlock("offices", offices, setOfficesSaving, setOfficesNotice)} />
              <NoticeText notice={officesNotice} />
            </div>
          </div>

          {/* Company profile */}
          <div className="border border-line bg-white p-6">
            <CardHeader title="Company profile" subtitle="The registration/license details table." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Section heading" value={profile.heading} onChange={(v) => setProfile({ ...profile, heading: v })} />
              <Field label="Intro line" value={profile.intro} onChange={(v) => setProfile({ ...profile, intro: v })} />
            </div>
            <div className="mt-4 divide-y divide-line border border-line">
              {profile.rows.map((row, i) => (
                <div key={i} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
                  <Field
                    label="Label"
                    value={row.label}
                    onChange={(v) => {
                      const next = [...profile.rows];
                      next[i] = { ...row, label: v };
                      setProfile({ ...profile, rows: next });
                    }}
                  />
                  <Field
                    label="Value"
                    value={row.value}
                    onChange={(v) => {
                      const next = [...profile.rows];
                      next[i] = { ...row, value: v };
                      setProfile({ ...profile, rows: next });
                    }}
                  />
                  <Field
                    label="Badge (blank for none)"
                    value={row.badge ?? ""}
                    onChange={(v) => {
                      const next = [...profile.rows];
                      next[i] = { ...row, badge: v || null };
                      setProfile({ ...profile, rows: next });
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink/40">
              Rows are fixed in number (their icons are matched by position) — labels, values and badges are
              editable.
            </p>
            <SaveButton saving={profileSaving} onClick={() => saveBlock("profile", profile, setProfileSaving, setProfileNotice)} />
            <NoticeText notice={profileNotice} />
          </div>

          {/* Key contacts */}
          <div className="border border-line bg-white p-6">
            <CardHeader title="Key contacts" subtitle="The staff directory cards." />
            <div className="mt-5">
              <Field label="Section heading" value={contacts.heading} onChange={(v) => setContacts({ ...contacts, heading: v })} />
            </div>
            <div className="mt-4 space-y-4">
              {contacts.contacts.map((c, i) => (
                <div key={i} className="border border-line bg-paper p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wide text-ink/40">Contact {i + 1}</span>
                    <button
                      onClick={() => setContacts({ ...contacts, contacts: contacts.contacts.filter((_, j) => j !== i) })}
                      className="text-ink/40 hover:text-signal"
                      title="Remove contact"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {(["name", "role", "phone", "email"] as (keyof ContactItem)[]).map((field) => (
                      <Field
                        key={field}
                        label={field[0].toUpperCase() + field.slice(1)}
                        value={c[field]}
                        onChange={(v) => {
                          const next = [...contacts.contacts];
                          next[i] = { ...c, [field]: v };
                          setContacts({ ...contacts, contacts: next });
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setContacts({
                  ...contacts,
                  contacts: [...contacts.contacts, { name: "New contact", role: "", phone: "", email: "" }],
                })
              }
              className="mt-3 flex items-center gap-1.5 border border-line px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-ink/60 hover:border-ink hover:text-ink"
            >
              <Plus size={13} /> Add contact
            </button>
            <div>
              <SaveButton saving={contactsSaving} onClick={() => saveBlock("contacts", contacts, setContactsSaving, setContactsNotice)} />
              <NoticeText notice={contactsNotice} />
            </div>
          </div>

          {/* Footer / get a quote */}
          <div className="border border-line bg-white p-6">
            <CardHeader title="Footer & contact CTA" subtitle="The closing 'get a quote' section and copyright line." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Heading" value={footer.heading} onChange={(v) => setFooter({ ...footer, heading: v })} />
              <Field label="Copyright line" value={footer.copyrightLine} onChange={(v) => setFooter({ ...footer, copyrightLine: v })} />
              <div className="sm:col-span-2">
                <Field label="Body" value={footer.body} onChange={(v) => setFooter({ ...footer, body: v })} textarea />
              </div>
              <Field label="Address" value={footer.address} onChange={(v) => setFooter({ ...footer, address: v })} />
              <Field label="Email" value={footer.email} onChange={(v) => setFooter({ ...footer, email: v })} />
              <Field label="Phone" value={footer.phone} onChange={(v) => setFooter({ ...footer, phone: v })} />
            </div>
            <SaveButton saving={footerSaving} onClick={() => saveBlock("footer", footer, setFooterSaving, setFooterNotice)} />
            <NoticeText notice={footerNotice} />
          </div>

          {/* Social links */}
          <div className="border border-line bg-white p-6">
            <CardHeader title="Social media" subtitle="Links behind the icons in the header's top bar." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Twitter / X" value={social.twitter} onChange={(v) => setSocial({ ...social, twitter: v })} />
              <Field label="Instagram" value={social.instagram} onChange={(v) => setSocial({ ...social, instagram: v })} />
              <Field label="LinkedIn" value={social.linkedin} onChange={(v) => setSocial({ ...social, linkedin: v })} />
              <Field label="Facebook" value={social.facebook} onChange={(v) => setSocial({ ...social, facebook: v })} />
            </div>
            <p className="mt-2 text-[11px] text-ink/40">
              Paste the full profile URL (e.g. https://facebook.com/yourpage). Leave a field blank to hide that
              icon entirely.
            </p>
            <SaveButton saving={socialSaving} onClick={() => saveBlock("social", social, setSocialSaving, setSocialNotice)} />
            <NoticeText notice={socialNotice} />
          </div>

          {/* Photo gallery */}
          <div className="border border-line bg-white p-6">
            <CardHeader title="Photo gallery" subtitle="Powers the public /gallery page." />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Page heading" value={gallery.heading} onChange={(v) => setGallery({ ...gallery, heading: v })} />
              <Field label="Intro line" value={gallery.intro} onChange={(v) => setGallery({ ...gallery, intro: v })} />
            </div>
            <SaveButton
              saving={gallerySaving}
              onClick={() => saveBlock("gallery", gallery, setGallerySaving, setGalleryNotice)}
            />

            <div className="mt-6 border-t border-line pt-5">
              <span className="mb-3 block font-mono text-[10px] uppercase tracking-wide text-ink/50">
                Photos ({gallery.images.length})
              </span>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {gallery.images.map((img) => (
                  <div key={img.path} className="group relative border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="aspect-square w-full object-cover" />
                    <button
                      onClick={() => handleGalleryDelete(img.path)}
                      disabled={galleryUploading}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center bg-ink/70 text-paper opacity-0 transition-opacity hover:bg-signal group-hover:opacity-100 disabled:opacity-50"
                      title="Remove photo"
                    >
                      <Trash2 size={13} />
                    </button>
                    <input
                      type="text"
                      value={img.caption}
                      onChange={(e) => {
                        const nextImages = gallery.images.map((i) =>
                          i.path === img.path ? { ...i, caption: e.target.value } : i
                        );
                        setGallery({ ...gallery, images: nextImages });
                      }}
                      onBlur={() => saveBlock("gallery", gallery, setGallerySaving, setGalleryNotice)}
                      placeholder="Caption (optional)"
                      className="w-full border-t border-line bg-white px-1.5 py-1 text-[10px] placeholder:text-ink/30 focus:outline-none"
                    />
                  </div>
                ))}
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-line text-ink/40 hover:border-ink hover:text-ink">
                  <ImagePlus size={18} />
                  <span className="font-mono text-[10px] uppercase tracking-wide">
                    {galleryUploading ? "Uploading…" : "Add photos"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    disabled={galleryUploading}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) handleGalleryUpload(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="mt-2 text-[11px] text-ink/40">JPG, PNG, WEBP or GIF, up to 8MB each. Select multiple files to upload several at once.</p>
              <NoticeText notice={galleryNotice} />
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
