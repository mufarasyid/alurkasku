import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Users, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Skeleton } from "../../components/ui/skeleton";
import { formatIDR, formatShortDate } from "../../lib/format";
import { cn } from "../../lib/utils";
import {
  getPatunganGroups,
  createPatunganGroup,
  deletePatunganGroup,
} from "../../services/patungan";

const PatunganPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formNote, setFormNote] = useState("");
  const [memberText, setMemberText] = useState("");
  const [members, setMembers] = useState([]);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchGroups = () => {
    getPatunganGroups()
      .then((res) => {
        setGroups(res.data ?? []);
        setLoadError("");
      })
      .catch((err) => setLoadError(err.message || "Gagal memuat patungan."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const visibleGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(
      (g) => g.name.toLowerCase().includes(q) || (g.note ?? "").toLowerCase().includes(q),
    );
  }, [groups, query]);

  const addMember = (raw) => {
    const name = raw.trim();
    if (!name) return true;
    const lower = name.toLowerCase();
    if (members.some((m) => m.toLowerCase() === lower)) {
      setFormError(`Nama "${name}" sudah ditambahkan.`);
      return false;
    }
    if (members.length >= 50) {
      setFormError("Maksimal 50 peserta per group.");
      return false;
    }
    setMembers((prev) => [...prev, name]);
    setFormError("");
    return true;
  };

  const handleMemberKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (addMember(memberText)) setMemberText("");
    }
  };

  const openCreate = () => {
    setFormName("");
    setFormNote("");
    setMemberText("");
    setMembers([]);
    setFormError("");
    setCreateOpen(true);
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (memberText.trim()) {
      if (!addMember(memberText)) return;
      setMemberText("");
    }
    const name = formName.trim();
    if (!name) return;
    setIsSaving(true);
    setFormError("");
    try {
      const res = await createPatunganGroup({
        name,
        note: formNote.trim(),
        members: members.map((display_name) => ({ display_name })),
      });
      setGroups((prev) => [res.data, ...prev]);
      setCreateOpen(false);
      if (res.data?.id) navigate(`/dashboard/patungan/${res.data.id}`);
    } catch (err) {
      setFormError(err.message || "Gagal membuat patungan.");
    } finally {
      setIsSaving(false);
    }
  };


  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deletePatunganGroup(pendingDelete.id);
      setGroups((prev) => prev.filter((g) => g.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setLoadError(err.message || "Gagal menghapus patungan.");
      setPendingDelete(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 md:min-h-0 md:flex-1">
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold lg:text-3xl">Patungan</h1>
          <p className="text-sm text-muted-foreground">
            Catat patungan tanpa semua orang harus punya akun di sini.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9 rounded-full px-5">
          <Plus size={17} strokeWidth={2} />
          <p>Buat Patungan</p>
        </Button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex shrink-0 items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{loadError}</span>
          <button
            type="button"
            onClick={() => setLoadError("")}
            aria-label="Tutup pesan error"
            className="rounded-md p-0.5 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari patungan"
            aria-label="Cari patungan"
            className="h-9 rounded-full pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{visibleGroups.length} group</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Memuat patungan">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex flex-col gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
              </div>
            </Card>
          ))}
        </div>
      ) : visibleGroups.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="size-5" strokeWidth={1.8} />
            </span>
            <h2 className="font-semibold">{query ? "Tidak ada hasil" : "Belum ada patungan"}</h2>
            <p className="text-sm text-muted-foreground">
              {query
                ? "Coba kata kunci lain."
                : "Buat group pertama, contoh padel 6 orang, lalu tambah nama satu-satu."}
            </p>
            {!query && (
              <Button onClick={openCreate} className="h-9 rounded-full px-5">
                <Plus size={17} strokeWidth={2} />
                <p>Buat Patungan</p>
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleGroups.map((group) => (
            <Card
              key={group.id}
              className="group cursor-pointer p-5 transition-colors hover:border-primary/40"
              onClick={() => navigate(`/dashboard/patungan/${group.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter") navigate(`/dashboard/patungan/${group.id}`);
              }}
              tabIndex={0}
              role="link"
              aria-label={`Buka patungan ${group.name}`}
            >
              <CardContent className="flex flex-col gap-3 p-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="truncate font-semibold">{group.name}</h3>
                    {group.note && <p className="line-clamp-2 text-sm text-muted-foreground">{group.note}</p>}
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground",
                    )}
                  >
                    <Users className="size-3.5" />
                    {group.member_count ?? 0}
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Total pengeluaran</span>
                    <span className="font-semibold tabular-nums">{formatIDR(group.total_expense)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatShortDate(group.updated_at)}</span>
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-3">
                  <button
                    type="button"
                    aria-label={`Ubah ${group.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/dashboard/patungan/${group.id}`);
                    }}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Hapus ${group.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    onClick={(event) => {
                      event.stopPropagation();
                      setPendingDelete(group);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={(open) => !open && setCreateOpen(false)}>
        <DialogContent>
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Buat patungan</DialogTitle>
              <DialogDescription>
                Tambah nama peserta satu-satu. Peserta tidak perlu punya akun di sini.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="patungan-name" className="text-sm font-medium">Nama group</label>
                <Input
                  id="patungan-name"
                  autoFocus
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="Contoh: Padel Sabtu"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="patungan-note" className="text-sm font-medium">Catatan (opsional)</label>
                <Input
                  id="patungan-note"
                  value={formNote}
                  onChange={(event) => setFormNote(event.target.value)}
                  placeholder="Contoh: Sewa lapangan + bola"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="patungan-members" className="text-sm font-medium">Peserta lain</label>
                <div className="flex gap-2">
                  <Input
                    id="patungan-members"
                    value={memberText}
                    onChange={(event) => setMemberText(event.target.value)}
                    onKeyDown={handleMemberKeyDown}
                    placeholder="Tulis nama, tekan Enter"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (addMember(memberText)) setMemberText("");
                    }}
                  >
                    Tambah
                  </Button>
                </div>
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Daftar peserta">
                    {members.map((name) => (
                      <button
                        key={name.toLowerCase()}
                        type="button"
                        onClick={() => setMembers((prev) => prev.filter((m) => m !== name))}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        aria-label={`Hapus peserta ${name}`}
                      >
                        {name}
                        <X className="size-3.5" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Kamu otomatis masuk sebagai peserta pertama. Tambah {members.length === 0 ? "nama lain" : `${members.length} nama`} di atas.
                </p>
              </div>
            </div>

            {formError && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={isSaving}>
                Batal
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Buat Group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus patungan</DialogTitle>
            <DialogDescription>
              {pendingDelete ? `Hapus ${pendingDelete.name}? Semua pengeluaran dan pelunasan ikut terhapus.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={17} strokeWidth={1.8} />
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatunganPage;
