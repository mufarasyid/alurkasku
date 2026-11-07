import { useState } from "react";

import { Button } from "../ui/button";
import { Input, RupiahInput } from "../ui/input";
import { DatePicker } from "../ui/datepicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectEmptyItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { createTransfer, createWithdrawal } from "../../services/transfers";
import { formatIDR } from "../../lib/format";

const todayString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
};

const AccountTransferDialog = ({ mode, open, onOpenChange, accounts = [], onSuccess }) => {
  const isWithdrawal = mode === "withdrawal";
  const title = isWithdrawal ? "Tarik Tunai" : "Transfer";
  const description = isWithdrawal
    ? "Withdraw cash from a bank or wallet account to your Cash account."
    : "Move money between your own accounts.";

  const fromAccounts = isWithdrawal
    ? accounts.filter((account) => account.type === "Bank" || account.type === "Wallet")
    : accounts;
  const toAccounts = (fromId) =>
    isWithdrawal
      ? accounts.filter((account) => account.type === "Cash")
      : accounts.filter((account) => account.id !== fromId);

  const [fromAccountId, setFromAccountId] = useState(() => fromAccounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(
    () => toAccounts(fromAccounts[0]?.id ?? "")[0]?.id ?? "",
  );
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayString);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleFromChange = (value) => {
    setFromAccountId(value);
    if (toAccountId === value) {
      setToAccountId(toAccounts(value)[0]?.id ?? "");
    }
  };

  const canSubmit =
    !isSaving &&
    fromAccountId &&
    toAccountId &&
    fromAccountId !== toAccountId &&
    ((isWithdrawal
      ? accounts.some((a) => a.id === toAccountId && a.type === "Cash")
      : true) &&
      fromAccounts.length > 0);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const parsedAmount = Number(amount);
    const parsedFee = fee === "" ? 0 : Number(fee);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }
    if (!Number.isFinite(parsedFee) || parsedFee < 0) {
      setError("Fee must not be negative.");
      return;
    }
    if (!fromAccountId || !toAccountId) {
      setError(isWithdrawal ? "Select a source and a Cash account." : "Select both accounts.");
      return;
    }
    if (fromAccountId === toAccountId) {
      setError("Source and destination must be different accounts.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      const payload = {
        from_account_id: fromAccountId,
        to_account_id: toAccountId,
        amount: parsedAmount,
        fee: parsedFee,
        note: note.trim(),
        occurred_at: date ? new Date(date).toISOString() : new Date().toISOString(),
      };
      if (isWithdrawal) {
        await createWithdrawal(payload);
      } else {
        await createTransfer(payload);
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err.message || `Failed to ${isWithdrawal ? "withdraw cash" : "transfer"}.`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onOpenChange(false)}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="transfer-from" className="text-sm font-medium">
                  From account
                </label>
                <Select value={fromAccountId} onValueChange={handleFromChange}>
                  <SelectTrigger id="transfer-from" className="w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={6}>
                    {fromAccounts.length === 0 && (
                      <SelectEmptyItem>No accounts available</SelectEmptyItem>
                    )}
                    {fromAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} · {formatIDR(account.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fromAccounts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {isWithdrawal
                      ? "No Bank or Wallet accounts yet."
                      : "No accounts yet. Create one first."}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transfer-to" className="text-sm font-medium">
                  To account
                </label>
                <Select value={toAccountId} onValueChange={setToAccountId}>
                  <SelectTrigger id="transfer-to" className="w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent side="bottom" sideOffset={6}>
                    {toAccounts(fromAccountId).length === 0 && (
                      <SelectEmptyItem>No accounts available</SelectEmptyItem>
                    )}
                    {toAccounts(fromAccountId).map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} · {formatIDR(account.balance)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isWithdrawal && toAccounts(fromAccountId).length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No Cash account yet. Create a Cash account first.
                  </p>
                )}
                {!isWithdrawal && toAccounts(fromAccountId).length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Need at least two accounts to transfer.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="transfer-amount" className="text-sm font-medium">
                  Amount (Rp)
                </label>
                <RupiahInput
                  id="transfer-amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0"
                  autoFocus
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transfer-fee" className="text-sm font-medium">
                  Admin fee (Rp) <span className="font-normal text-muted-foreground">optional</span>
                </label>
                <RupiahInput
                  id="transfer-fee"
                  value={fee}
                  onChange={(event) => setFee(event.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="transfer-date" className="text-sm font-medium">
                  Date
                </label>
                <DatePicker
                  id="transfer-date"
                  value={date}
                  max={todayString()}
                  onChange={setDate}
                  placeholder="Pick a date"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="transfer-note" className="text-sm font-medium">
                  Note
                </label>
                <Input
                  id="transfer-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={isWithdrawal ? "e.g. ATM withdrawal" : "e.g. Top up GoPay"}
                />
              </div>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSaving ? "Processing..." : title}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AccountTransferDialog;
