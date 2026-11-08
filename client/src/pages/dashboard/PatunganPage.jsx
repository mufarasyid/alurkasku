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
      .catch((err) => setLoadError(err.message || "Failed to load patungan groups."))
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
      setFormError(`Name "${name}" is already added.`);
      return false;
    }
    if (members.length >= 50) {
      setFormError("Maximum 50 participants per group.");
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
      setFormError(err.message || "Failed to create patungan group.");
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
      setLoadError(err.message || "Failed to delete patungan group.");
      setPendingDelete(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 md:min-h-0 md:flex-1">
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold lg:text-3xl">Patungan</h1>
          <p className="text-sm text-muted-foreground">
            Track shared expenses without everyone having a registered account.
          </p>
        </div>
        <Button onClick={openCreate} className="h-9 rounded-full px-5">
          <Plus size={17} strokeWidth={2} />
          <p>Create Patungan</p>
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
            aria-label="Dismiss error"
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
            placeholder="Search patungan groups"
            aria-label="Search patungan groups"
            className="h-9 rounded-full pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">{visibleGroups.length} groups</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading patungan groups">
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
            <h2 className="font-semibold">{query ? "No results" : "No patungan groups yet"}</h2>
            <p className="text-sm text-muted-foreground">
              {query
                ? "Try another keyword."
                : "Create your first group, for example a 6-person padel session, then add names one by one."}
            </p>
            {!query && (
              <Button onClick={openCreate} className="h-9 rounded-full px-5">
                <Plus size={17} strokeWidth={2} />
                <p>Create Patungan</p>
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
              aria-label={`Open patungan ${group.name}`}
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
                    <span className="text-xs text-muted-foreground">Total expenses</span>
                    <span className="font-semibold tabular-nums">{formatIDR(group.total_expense)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatShortDate(group.updated_at)}</span>
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-3">
                  <button
                    type="button"
                    aria-label={`Edit ${group.name}`}
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
                    aria-label={`Delete ${group.name}`}
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
              <DialogTitle>Create patungan group</DialogTitle>
              <DialogDescription>
                Add participant names one by one. Participants do not need an account.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="patungan-name" className="text-sm font-medium">Group name</label>
                <Input
                  id="patungan-name"
                  autoFocus
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  placeholder="e.g. Saturday Padel"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="patungan-note" className="text-sm font-medium">Note (optional)</label>
                <Input
                  id="patungan-note"
                  value={formNote}
                  onChange={(event) => setFormNote(event.target.value)}
                  placeholder="e.g. Court rental + balls"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="patungan-members" className="text-sm font-medium">Other participants</label>
                <div className="flex gap-2">
                  <Input
                    id="patungan-members"
                    value={memberText}
                    onChange={(event) => setMemberText(event.target.value)}
                    onKeyDown={handleMemberKeyDown}
                    placeholder="Type a name, press Enter"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (addMember(memberText)) setMemberText("");
                    }}
                  >
                    Add
                  </Button>
                </div>
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1" aria-label="Participant list">
                    {members.map((name) => (
                      <button
                        key={name.toLowerCase()}
                        type="button"
                        onClick={() => setMembers((prev) => prev.filter((m) => m !== name))}
                        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        aria-label={`Remove ${name}`}
                      >
                        {name}
                        <X className="size-3.5" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  You are automatically added as the first participant. Add {members.length === 0 ? "other names" : `${members.length} names`} above.
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
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Create group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete patungan group</DialogTitle>
            <DialogDescription>
              {pendingDelete ? `Delete ${pendingDelete.name}? All expenses and settlements will also be deleted.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 size={17} strokeWidth={1.8} />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatunganPage;
