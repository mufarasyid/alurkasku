import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input, RupiahInput } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Skeleton } from "../../components/ui/skeleton";
import { formatIDR, formatShortDate } from "../../lib/format";
import { cn } from "../../lib/utils";
import {
  getPatunganGroup,
  updatePatunganGroup,
  addPatunganMember,
  deletePatunganMember,
  linkPatunganMember,
  getPatunganSummary,
  getPatunganExpenses,
  createPatunganExpense,
  deletePatunganExpense,
  getPatunganSettlements,
  createPatunganSettlement,
  deletePatunganSettlement,
} from "../../services/patungan";

const splitLabel = (value) => ({ equal: "Rata", nominal: "Nominal", percent: "Persentase" })[value] ?? value;

const netLabel = (net) => {
  if (net > 0) return { text: `Ditombok ${formatIDR(net)}`, className: "text-emerald-700 bg-emerald-500/10" };
  if (net < 0) return { text: `Perlu bayar ${formatIDR(Math.abs(net))}`, className: "text-orange-700 bg-orange-500/10" };
  return { text: "Lunas", className: "text-muted-foreground bg-muted" };
};

const PatunganDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [summary, setSummary] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("ringkasan");

  const [memberName, setMemberName] = useState("");
  const [memberError, setMemberError] = useState("");
  const [linkInputs, setLinkInputs] = useState({});
  const [linkError, setLinkError] = useState("");
  const [pendingDeleteMember, setPendingDeleteMember] = useState(null);

  const [expenseOpen, setExpenseOpen] = useState(false);
  const [payer, setPayer] = useState("");
  const [total, setTotal] = useState("");
  const [note, setNote] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [selected, setSelected] = useState({});
  const [shares, setShares] = useState({});
  const [expenseError, setExpenseError] = useState("");
  const [pendingDeleteExpense, setPendingDeleteExpense] = useState(null);

  const [settleOpen, setSettleOpen] = useState(false);
  const [fromMember, setFromMember] = useState("");
  const [toMember, setToMember] = useState("");
  const [amount, setAmount] = useState("");
  const [settleNote, setSettleNote] = useState("");
  const [settleError, setSettleError] = useState("");
  const [pendingDeleteSettle, setPendingDeleteSettle] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editError, setEditError] = useState("");

  const loadAll = () => {
    Promise.all([
      getPatunganGroup(id),
      getPatunganSummary(id),
      getPatunganExpenses(id),
      getPatunganSettlements(id),
    ])
      .then(([gRes, sRes, eRes, stRes]) => {
        setGroup(gRes.data?.group ?? null);
        setParticipants(gRes.data?.participants ?? []);
        setSummary(sRes.data ?? null);
        const exps = eRes.data ?? [];
        const stls = stRes.data ?? [];
        setExpenses(exps);
        setSettlements(stls);
        setLoadError("");
        const nextParticipants = gRes.data?.participants ?? [];
        if (nextParticipants.length > 0) {
          setPayer((prev) => prev || nextParticipants[0].id);
        }
      })
      .catch((err) => setLoadError(err.message || "Gagal memuat detail patungan."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const participantMap = useMemo(() => {
    const map = new Map();
    participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [participants]);

  const handleAddMember = async (event) => {
    event.preventDefault();
    const name = memberName.trim();
    if (!name) return;
    setMemberError("");
    try {
      const res = await addPatunganMember(id, { display_name: name });
      setParticipants((prev) => [...prev, res.data]);
      setMemberName("");
    } catch (err) {
      setMemberError(err.message || "Gagal menambah peserta.");
    }
  };

  const handleLink = async (memberId) => {
    const email = (linkInputs[memberId] ?? "").trim();
    if (!email) return;
    setLinkError("");
    try {
      const res = await linkPatunganMember(id, memberId, { email });
      setParticipants((prev) => prev.map((p) => (p.id === memberId ? res.data : p)));
      setLinkInputs((prev) => ({ ...prev, [memberId]: "" }));
    } catch (err) {
      setLinkError(err.message || "Gagal menautkan akun.");
    }
  };

  const handleDeleteMember = async () => {
    if (!pendingDeleteMember) return;
    try {
      await deletePatunganMember(id, pendingDeleteMember.id);
      setParticipants((prev) => prev.filter((p) => p.id !== pendingDeleteMember.id));
      setPendingDeleteMember(null);
      loadAll();
    } catch (err) {
      setMemberError(err.message || "Gagal menghapus peserta.");
      setPendingDeleteMember(null);
    }
  };

  const openExpense = () => {
    setPayer(participants[0]?.id ?? "");
    setTotal("");
    setNote("");
    setSplitType("equal");
    const initSelected = {};
    participants.forEach((p) => { initSelected[p.id] = true; });
    setSelected(initSelected);
    setShares({});
    setExpenseError("");
    setExpenseOpen(true);
  };

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected],
  );

  const handleCreateExpense = async (event) => {
    event.preventDefault();
    const totalAmount = Number(total);
    if (!payer) { setExpenseError("Pilih siapa yang membayar."); return; }
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) { setExpenseError("Total harus lebih dari 0."); return; }
    if (selectedIds.length === 0) { setExpenseError("Pilih minimal 1 peserta untuk patungan."); return; }

    const splits = selectedIds.map((memberId) => {
      if (splitType === "nominal") return { member_id: memberId, share_amount: Number(shares[memberId] ?? 0) };
      if (splitType === "percent") return { member_id: memberId, percent: Number(shares[memberId] ?? 0) };
      return { member_id: memberId };
    });

    if (splitType === "nominal") {
      const sum = splits.reduce((acc, s) => acc + s.share_amount, 0);
      if (sum !== totalAmount) { setExpenseError(`Total nominal ${formatIDR(sum)} tidak cocok dengan ${formatIDR(totalAmount)}.`); return; }
    }
    if (splitType === "percent") {
      const sum = splits.reduce((acc, s) => acc + s.percent, 0);
      if (sum !== 100) { setExpenseError("Total persentase harus 100."); return; }
    }

    try {
      const res = await createPatunganExpense(id, {
        payer_member_id: payer,
        total_amount: totalAmount,
        note: note.trim(),
        split_type: splitType,
        splits,
      });
      setExpenses((prev) => [res.data, ...prev]);
      setExpenseOpen(false);
      loadAll();
    } catch (err) {
      setExpenseError(err.message || "Gagal menyimpan pengeluaran.");
    }
  };

  const handleDeleteExpense = async () => {
    if (!pendingDeleteExpense) return;
    try {
      await deletePatunganExpense(id, pendingDeleteExpense.id);
      setExpenses((prev) => prev.filter((e) => e.id !== pendingDeleteExpense.id));
      setPendingDeleteExpense(null);
      loadAll();
    } catch (err) {
      setLoadError(err.message || "Gagal menghapus pengeluaran.");
      setPendingDeleteExpense(null);
    }
  };

  const handleCreateSettle = async (event) => {
    event.preventDefault();
    const amt = Number(amount);
    if (!fromMember || !toMember) { setSettleError("Pilih pengirim dan penerima."); return; }
    if (fromMember === toMember) { setSettleError("Pengirim dan penerima harus beda."); return; }
    if (!Number.isFinite(amt) || amt <= 0) { setSettleError("Nominal harus lebih dari 0."); return; }
    try {
      const res = await createPatunganSettlement(id, {
        from_member_id: fromMember,
        to_member_id: toMember,
        amount: amt,
        note: settleNote.trim(),
      });
      setSettlements((prev) => [res.data, ...prev]);
      setSettleOpen(false);
      setFromMember(""); setToMember(""); setAmount(""); setSettleNote("");
      loadAll();
    } catch (err) {
      setSettleError(err.message || "Gagal menyimpan pelunasan.");
    }
  };

  const handleDeleteSettle = async () => {
    if (!pendingDeleteSettle) return;
    try {
      await deletePatunganSettlement(id, pendingDeleteSettle.id);
      setSettlements((prev) => prev.filter((s) => s.id !== pendingDeleteSettle.id));
      setPendingDeleteSettle(null);
      loadAll();
    } catch (err) {
      setLoadError(err.message || "Gagal menghapus pelunasan.");
      setPendingDeleteSettle(null);
    }
  };

  const openEdit = () => {
    setEditName(group?.name ?? "");
    setEditNote(group?.note ?? "");
    setEditError("");
    setEditOpen(true);
  };

  const handleEdit = async (event) => {
    event.preventDefault();
    try {
      const res = await updatePatunganGroup(id, { name: editName.trim(), note: editNote.trim() });
      setGroup((prev) => ({ ...prev, ...res.data }));
      setEditOpen(false);
    } catch (err) {
      setEditError(err.message || "Gagal mengubah group.");
    }
  };

  const equalShares = useMemo(() => {
    const map = {};
    const totalAmount = Number(total || 0);
    if (selectedIds.length === 0 || totalAmount <= 0) return map;
    const base = Math.floor(totalAmount / selectedIds.length);
    const rem = totalAmount % selectedIds.length;
    selectedIds.forEach((memberId, index) => {
      map[memberId] = base + (index < rem ? 1 : 0);
    });
    return map;
  }, [selectedIds, total]);

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-6" aria-busy="true" aria-label="Memuat detail patungan">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex w-full flex-col gap-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard/patungan")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-4" /> Kembali
        </button>
        {loadError ? (
          <Card className="border-destructive/30 p-6 text-destructive">{loadError}</Card>
        ) : (
          <Card className="p-6 text-sm text-muted-foreground">Patungan tidak ditemukan.</Card>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 md:min-h-0 md:flex-1">
      <div className="flex shrink-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => navigate("/dashboard/patungan")}
            className="mb-1 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" /> Semua patungan
          </button>
          <h1 className="text-2xl font-semibold lg:text-3xl">{group.name}</h1>
          {group.note && <p className="text-sm text-muted-foreground">{group.note}</p>}
          <p className="text-xs text-muted-foreground">
            {participants.length} peserta, total {formatIDR(summary?.total_expense ?? group.total_expense ?? 0)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={openEdit} className="h-9 rounded-full px-5">
            <p>Ubah Group</p>
          </Button>
          <Button onClick={openExpense} className="h-9 rounded-full px-5">
            <Plus size={17} strokeWidth={2} />
            <p>Tambah Pengeluaran</p>
          </Button>
          <Button variant="outline" onClick={() => { setFromMember(""); setToMember(""); setAmount(""); setSettleNote(""); setSettleError(""); setSettleOpen(true); }} className="h-9 rounded-full px-5">
            <Check size={17} strokeWidth={2} />
            <p>Catat Pelunasan</p>
          </Button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex shrink-0 items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{loadError}</span>
          <button type="button" onClick={() => setLoadError("")} aria-label="Tutup pesan error" className="rounded-md p-0.5 hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <X className="size-4" />
          </button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto flex-wrap justify-start rounded-xl p-1">
          <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
          <TabsTrigger value="pengeluaran">Pengeluaran ({expenses.length})</TabsTrigger>
          <TabsTrigger value="peserta">Peserta ({participants.length})</TabsTrigger>
          <TabsTrigger value="pelunasan">Pelunasan ({settlements.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="text-base">Saldo per peserta</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {summary?.balances?.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                          <th className="px-4 py-3 font-medium">Peserta</th>
                          <th className="px-4 py-3 text-right font-medium">Bayar</th>
                          <th className="px-4 py-3 text-right font-medium">Patungan</th>
                          <th className="px-4 py-3 text-right font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.balances.map((b) => {
                          const label = netLabel(b.net);
                          return (
                            <tr key={b.member_id} className="border-b border-border/40 last:border-0">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{b.display_name}</span>
                                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", b.is_guest ? "bg-amber-500/10 text-amber-700" : "bg-sky-500/10 text-sky-700")}>
                                    {b.is_guest ? "Guest" : "Akun"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums">{formatIDR(b.paid)}</td>
                              <td className="px-4 py-3 text-right tabular-nums">{formatIDR(b.share)}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium", label.className)}>{label.text}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Belum ada pengeluaran. Tambah pengeluaran untuk melihat saldo.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Saran pelunasan</CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.suggestions?.length ? (
                  <div className="flex flex-col gap-2">
                    {summary.suggestions.map((s, i) => (
                      <div key={`${s.from_member_id}-${s.to_member_id}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
                        <span className="text-sm"><span className="font-medium">{s.from_name}</span> bayar ke <span className="font-medium">{s.to_name}</span></span>
                        <span className="shrink-0 font-semibold tabular-nums">{formatIDR(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {expenses.length === 0 ? "Saran pelunasan muncul setelah ada pengeluaran." : "Semua sudah lunas."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pengeluaran" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {expenses.length ? (
                <div className="flex flex-col divide-y divide-border/50">
                  {expenses.map((e) => (
                    <div key={e.id} className="flex items-start justify-between gap-4 px-4 py-4">
                      <div className="flex min-w-0 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{e.note || "Pengeluaran"}</span>
                          <span className="text-xs text-muted-foreground">{formatShortDate(e.occurred_at)}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {participantMap.get(e.payer_member_id)?.display_name ?? e.payer_name} membayar
                        </span>
                        {e.splits?.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {e.splits.map((s) => `${s.member_name}: ${formatIDR(s.share_amount)}`).join("  ·  ")}
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold tabular-nums">{formatIDR(e.total_amount)}</span>
                        <button
                          type="button"
                          aria-label={`Hapus pengeluaran ${e.note || "tanpa catatan"}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onClick={() => setPendingDeleteExpense(e)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Belum ada pengeluaran. Klik Tambah Pengeluaran untuk mulai.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="peserta" className="mt-4">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <form onSubmit={handleAddMember} className="flex flex-1 gap-2">
                  <Input
                    value={memberName}
                    onChange={(event) => setMemberName(event.target.value)}
                    placeholder="Tulis nama peserta baru"
                    aria-label="Nama peserta baru"
                    className="flex-1"
                  />
                  <Button type="submit" className="h-9 rounded-full px-5 shrink-0">
                    <Plus size={17} strokeWidth={2} />
                    <p>Tambah</p>
                  </Button>
                </form>
                {memberError && <p role="alert" className="text-sm text-destructive">{memberError}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <div className="flex flex-col divide-y divide-border/50">
                  {participants.map((p) => (
                    <div key={p.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.display_name}</span>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", p.is_guest ? "bg-amber-500/10 text-amber-700" : "bg-sky-500/10 text-sky-700")}>
                          {p.is_guest ? "Guest" : "Akun"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {p.is_guest && (
                          <div className="flex flex-1 items-center gap-2 sm:flex-none">
                            <Input
                              value={linkInputs[p.id] ?? ""}
                              onChange={(event) => setLinkInputs((prev) => ({ ...prev, [p.id]: event.target.value }))}
                              placeholder="Email akun terdaftar"
                              aria-label={`Tautkan akun untuk ${p.display_name}`}
                              className="h-8 w-full sm:w-52 text-sm"
                            />
                            <Button type="button" variant="outline" className="h-8 shrink-0" onClick={() => handleLink(p.id)}>Tautkan</Button>
                          </div>
                        )}
                        <button
                          type="button"
                          aria-label={`Hapus peserta ${p.display_name}`}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onClick={() => setPendingDeleteMember(p)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {linkError && <p role="alert" className="text-sm text-destructive">{linkError}</p>}
          </div>
        </TabsContent>

        <TabsContent value="pelunasan" className="mt-4">
          <Card>
            <CardContent className="p-0">
              {settlements.length ? (
                <div className="flex flex-col divide-y divide-border/50">
                  {settlements.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-4">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="text-sm"><span className="font-medium">{s.from_name}</span> bayar ke <span className="font-medium">{s.to_name}</span></span>
                        {s.note && <span className="text-xs text-muted-foreground">{s.note}</span>}
                        <span className="text-xs text-muted-foreground">{formatShortDate(s.occurred_at)}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-semibold tabular-nums">{formatIDR(s.amount)}</span>
                        <button
                          type="button"
                          aria-label={`Hapus pelunasan dari ${s.from_name} ke ${s.to_name}`}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          onClick={() => setPendingDeleteSettle(s)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Belum ada pelunasan. Catat pelunasan saat ada yang membayar ke peserta lain.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={expenseOpen} onOpenChange={(open) => !open && setExpenseOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleCreateExpense}>
            <DialogHeader>
              <DialogTitle>Tambah pengeluaran</DialogTitle>
              <DialogDescription>Pilih siapa yang membayar, lalu bagi ke peserta.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="expense-payer" className="text-sm font-medium">Dibayar oleh</label>
                <Select value={payer} onValueChange={setPayer}>
                  <SelectTrigger id="expense-payer" className="w-full">
                    <SelectValue placeholder="Pilih peserta" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={6}>
                    {participants.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="expense-total" className="text-sm font-medium">Total (Rp)</label>
                  <RupiahInput id="expense-total" value={total} onChange={(event) => setTotal(event.target.value)} placeholder="300.000" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="expense-split" className="text-sm font-medium">Cara bagi</label>
                  <Select value={splitType} onValueChange={setSplitType}>
                    <SelectTrigger id="expense-split" className="w-full">
                      <SelectValue placeholder="Cara bagi" />
                    </SelectTrigger>
                    <SelectContent side="bottom" sideOffset={6}>
                      <SelectItem value="equal">Rata</SelectItem>
                      <SelectItem value="nominal">Nominal</SelectItem>
                      <SelectItem value="percent">Persentase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="expense-note" className="text-sm font-medium">Catatan</label>
                <Input id="expense-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Contoh: Lapangan padel" />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Dibagi ke</span>
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2">
                    <input
                      type="checkbox"
                      id={`split-${p.id}`}
                      checked={!!selected[p.id]}
                      onChange={(event) => setSelected((prev) => ({ ...prev, [p.id]: event.target.checked }))}
                      className="size-4 accent-primary"
                    />
                    <label htmlFor={`split-${p.id}`} className="flex-1 text-sm">{p.display_name}</label>
                    {selected[p.id] && splitType === "equal" && (
                      <span className="text-sm font-medium tabular-nums">{formatIDR(equalShares[p.id] ?? 0)}/orang</span>
                    )}
                    {selected[p.id] && splitType !== "equal" && (
                      <Input
                        value={shares[p.id] ?? ""}
                        onChange={(event) => setShares((prev) => ({ ...prev, [p.id]: event.target.value }))}
                        placeholder={splitType === "percent" ? "%" : "Rp"}
                        inputMode="numeric"
                        aria-label={`Bagian ${p.display_name}`}
                        className="h-8 w-28 text-right"
                      />
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Mode: {splitLabel(splitType)}.
                  {splitType === "equal" && ` Estimasi ${(selectedIds[0] ? formatIDR(equalShares[selectedIds[0]] ?? 0) : "-")} per orang.`}
                  {splitType === "nominal" && " Total nominal harus sama dengan total."}
                  {splitType === "percent" && " Total persen harus 100."}
                </p>
              </div>
            </div>

            {expenseError && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {expenseError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={settleOpen} onOpenChange={(open) => !open && setSettleOpen(false)}>
        <DialogContent>
          <form onSubmit={handleCreateSettle}>
            <DialogHeader>
              <DialogTitle>Catat pelunasan</DialogTitle>
              <DialogDescription>Catat saat satu peserta membayar ke peserta lain.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settle-from" className="text-sm font-medium">Dari</label>
                  <Select value={fromMember} onValueChange={setFromMember}>
                    <SelectTrigger id="settle-from" className="w-full"><SelectValue placeholder="Pengirim" /></SelectTrigger>
                    <SelectContent side="bottom" sideOffset={6}>
                      {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="settle-to" className="text-sm font-medium">Ke</label>
                  <Select value={toMember} onValueChange={setToMember}>
                    <SelectTrigger id="settle-to" className="w-full"><SelectValue placeholder="Penerima" /></SelectTrigger>
                    <SelectContent side="bottom" sideOffset={6}>
                      {participants.map((p) => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="settle-amount" className="text-sm font-medium">Nominal (Rp)</label>
                <RupiahInput id="settle-amount" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="50.000" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="settle-note" className="text-sm font-medium">Catatan (opsional)</label>
                <Input id="settle-note" value={settleNote} onChange={(event) => setSettleNote(event.target.value)} placeholder="Contoh: Bayar lapangan" />
              </div>
            </div>

            {settleError && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {settleError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSettleOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDeleteMember !== null} onOpenChange={(open) => !open && setPendingDeleteMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus peserta</DialogTitle>
            <DialogDescription>
              {pendingDeleteMember ? `Hapus ${pendingDeleteMember.display_name}? Peserta hanya bisa dihapus kalau saldonya sudah nol.` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteMember(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteMember}><Trash2 size={17} strokeWidth={1.8} /> Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDeleteExpense !== null} onOpenChange={(open) => !open && setPendingDeleteExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus pengeluaran</DialogTitle>
            <DialogDescription>
              {pendingDeleteExpense ? `Hapus ${pendingDeleteExpense.note || "pengeluaran"} senilai ${formatIDR(pendingDeleteExpense.total_amount)}?` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteExpense(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteExpense}><Trash2 size={17} strokeWidth={1.8} /> Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pendingDeleteSettle !== null} onOpenChange={(open) => !open && setPendingDeleteSettle(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus pelunasan</DialogTitle>
            <DialogDescription>
              {pendingDeleteSettle ? `Hapus pelunasan ${pendingDeleteSettle.from_name} ke ${pendingDeleteSettle.to_name} senilai ${formatIDR(pendingDeleteSettle.amount)}?` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteSettle(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteSettle}><Trash2 size={17} strokeWidth={1.8} /> Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => !open && setEditOpen(false)}>
        <DialogContent>
          <form onSubmit={handleEdit}>
            <DialogHeader>
              <DialogTitle>Ubah group</DialogTitle>
              <DialogDescription>Nama dan catatan group. Hanya pemilik group yang bisa mengubah.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-name" className="text-sm font-medium">Nama group</label>
                <Input id="edit-name" autoFocus value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Contoh: Padel Sabtu" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="edit-note" className="text-sm font-medium">Catatan (opsional)</label>
                <Input id="edit-note" value={editNote} onChange={(event) => setEditNote(event.target.value)} placeholder="Contoh: Sewa lapangan + bola" />
              </div>
            </div>
            {editError && (
              <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {editError}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatunganDetailPage;
