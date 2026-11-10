import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { formatShortDate } from "../../lib/format";
import { useDebouncedValue } from "../../lib/use-debounced-value";
import { getStoredUser } from "../../lib/auth-storage";
import {
  listAdminUsers,
  updateAdminUser,
  deleteAdminUser,
} from "../../services/admin";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { DataTable } from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "../../components/ui/dropdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { FilterInput, Toolbar, TableSkeleton } from "./components";

const PAGE_SIZE = 10;
const ROLE_FILTERS = [
  { key: "all", label: "All roles" },
  { key: "admin", label: "Admins" },
  { key: "user", label: "Members" },
];

const initialsOf = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [me] = useState(() => getStoredUser() ?? null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [reloadNonce, setReloadNonce] = useState(0);
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formTarget, setFormTarget] = useState(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("user");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState("");

  const debouncedQuery = useDebouncedValue(query);

  useEffect(() => {
    let active = true;
    listAdminUsers({
      page,
      pageSize: PAGE_SIZE,
      q: debouncedQuery.trim(),
      role: roleFilter,
    })
      .then((res) => {
        if (!active) return;
        const meta = res?.meta;
        setUsers(Array.isArray(res?.data) ? res.data : []);
        setTotalPages(Math.max(1, meta?.total_pages ?? 1));
        setTotalItems(meta?.total_items ?? 0);
        setLoadError("");
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setUsers([]);
        setLoadError(err.message || "Failed to load members.");
        setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, debouncedQuery, roleFilter, reloadNonce]);

  const refresh = () => {
    setIsLoading(true);
    setReloadNonce((nonce) => nonce + 1);
  };

  const handleFilterChange = (value) => {
    setQuery(value);
    setPage(1);
    setIsLoading(true);
  };

  const handleRoleChange = (value) => {
    setRoleFilter(value);
    setPage(1);
    setIsLoading(true);
  };

  const handlePageChange = (value) => {
    setPage(value);
    setIsLoading(true);
  };

  const openForm = (user) => {
    setFormTarget(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormError("");
  };

  const isSelf = (user) => Boolean(me?.id && user?.id === me.id);

  const handleSave = async (event) => {
    event.preventDefault();
    const name = formName.trim();
    const email = formEmail.trim();
    if (name.length < 2) {
      setFormError("Name must be at least 2 characters.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    setIsSaving(true);
    setFormError("");
    try {
      await updateAdminUser(formTarget.id, {
        name,
        email,
        ...(isSelf(formTarget) ? {} : { role: formRole }),
      });
      setFormTarget(null);
      setNotice(`Updated ${email}.`);
      refresh();
    } catch (err) {
      setFormError(err.message || "Failed to save member.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteAdminUser(deleteTarget.id);
      setNotice(`Deleted ${deleteTarget.email}.`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      setLoadError(err.message || "Failed to delete member.");
      setDeleteTarget(null);
      setIsLoading(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Member",
      sortable: true,
      width: "min-w-[240px]",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-gold-foreground"
          >
            {initialsOf(row.name)}
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-medium">
              {row.name}
              {isSelf(row) && (
                <span className="text-muted-foreground"> (you)</span>
              )}
            </span>
            {row.role === "admin" && (
              <span className="text-xs text-muted-foreground">Administrator</span>
            )}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      width: "min-w-[220px]",
      render: (value) => (
        <span className="text-muted-foreground">{value}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      width: "w-[120px]",
      render: (value) => (
        <Badge
          variant={value === "admin" ? "default" : "secondary"}
          className={cn(value === "admin" && "gap-1")}
        >
          {value === "admin" && <ShieldCheck size={12} aria-hidden="true" />}
          {value}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Joined",
      sortable: true,
      width: "w-[140px]",
      render: (value) => (
        <span className="text-muted-foreground">
          {value ? formatShortDate(value) : "-"}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1920px] flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight lg:text-3xl">
          Members
        </h1>
        <p className="text-sm text-muted-foreground">
          Everyone with an account. Manage roles, edit profiles, or remove members.
        </p>
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="rounded-md px-1 text-xs font-medium uppercase tracking-wide opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Dismiss
          </button>
        </div>
      )}

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {loadError}
        </div>
      )}

      <Card className="flex w-full shrink-0 flex-col overflow-hidden border-border/60 shadow-sm">
        <Toolbar>
          <FilterInput
            value={query}
            onChange={handleFilterChange}
            placeholder="Filter members"
            label="Filter members by name or email"
          />
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap text-xs text-muted-foreground">
              {isLoading ? "Loading..." : `${totalItems} ${totalItems === 1 ? "member" : "members"}`}
            </span>
            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger aria-label="Filter by role" className="h-9 w-40 rounded-full">
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent side="bottom" sideOffset={6}>
                {ROLE_FILTERS.map(({ key, label }) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Toolbar>

        <CardContent className="p-3 sm:p-4">
          {isLoading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : (
            <DataTable
              columns={columns}
              data={users}
              pageSize={PAGE_SIZE}
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              emptyMessage={
                query || roleFilter !== "all"
                  ? "No members match this filter."
                  : "No members yet."
              }
              showActions
              actionsHeader=""
              actions={(row) => (
                <Dropdown>
                  <DropdownTrigger
                    aria-label={`Actions for ${row.email}`}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <MoreVertical className="size-4" aria-hidden="true" />
                  </DropdownTrigger>
                  <DropdownContent align="end" className="w-44">
                    <DropdownItem className="gap-2" onClick={() => navigate(`/dashboard/admin/${row.id}`)}>
                      <Eye size={16} aria-hidden="true" />
                      View data
                    </DropdownItem>
                    <DropdownItem className="gap-2" onClick={() => openForm(row)}>
                      <Pencil size={16} aria-hidden="true" />
                      Edit member
                    </DropdownItem>
                    <DropdownItem
                      className={cn(
                        "gap-2 text-destructive focus:text-destructive hover:text-destructive",
                        isSelf(row) && "pointer-events-none opacity-50",
                      )}
                      aria-disabled={isSelf(row)}
                      title={isSelf(row) ? "You can't delete your own account" : undefined}
                      onClick={() => !isSelf(row) && setDeleteTarget(row)}
                    >
                      <Trash2 size={16} aria-hidden="true" />
                      Delete member
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={Boolean(formTarget)} onOpenChange={(open) => !open && setFormTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit member</DialogTitle>
            <DialogDescription>
              {formTarget?.email}
              {isSelf(formTarget) && " - this is your own account"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-member-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="admin-member-name"
                value={formName}
                onChange={(event) => setFormName(event.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-member-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="admin-member-email"
                type="email"
                value={formEmail}
                onChange={(event) => setFormEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="admin-member-role" className="text-sm font-medium">
                Role
              </label>
              <Select value={formRole} onValueChange={setFormRole} disabled={isSelf(formTarget)}>
                <SelectTrigger id="admin-member-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent side="bottom" sideOffset={6}>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
              {isSelf(formTarget) && (
                <p className="text-xs text-muted-foreground">
                  You can't change your own role here.
                </p>
              )}
            </div>

            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {formError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete member</DialogTitle>
            <DialogDescription>
              This removes {deleteTarget?.name} ({deleteTarget?.email}) from the app.
              Their data is kept in the database as a soft delete and can be restored
              by an engineer if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
