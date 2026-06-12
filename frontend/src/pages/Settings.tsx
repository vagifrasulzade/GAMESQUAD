import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, Card, PageHeader } from "../components/ui";

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordBusy(true);
    setPasswordSaved(false);
    setPasswordError("");
    try {
      await api.post("/users/me/password/", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setPasswordSaved(true);
    } catch (error: any) {
      setPasswordError(
        error?.response?.data?.current_password?.[0] ??
          error?.response?.data?.confirm_password?.[0] ??
          error?.response?.data?.detail ??
          "Password could not be updated."
      );
    } finally {
      setPasswordBusy(false);
    }
  }

  async function deleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await api.delete("/users/me/", { data: { current_password: deletePassword } });
      logout();
      navigate("/login", { replace: true });
    } catch (error: any) {
      setDeleteError(
        error?.response?.data?.current_password?.[0] ??
          error?.response?.data?.detail ??
          "Account could not be deleted."
      );
      setDeleteBusy(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Settings" subtitle="Manage your account security." />

      <div className="space-y-6">
        <Card className="max-w-2xl p-6">
          <form onSubmit={changePassword} className="space-y-4">
            <h3 className="text-lg font-semibold">Change Password</h3>
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrentPassword}
              onToggle={() => setShowCurrentPassword((v) => !v)}
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNewPassword}
              onToggle={() => setShowNewPassword((v) => !v)}
            />
            <Field
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              type={showConfirmPassword ? "text" : "password"}
              action={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-card2 hover:text-white"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={passwordBusy}>
                {passwordBusy ? "Updating..." : "Update password"}
              </Button>
              {passwordSaved && <span className="text-sm text-good">Password updated ✓</span>}
              {passwordError && <span className="text-sm text-red-400">{passwordError}</span>}
            </div>
          </form>
        </Card>

        <Card className="max-w-2xl p-6">
          <form onSubmit={deleteAccount} className="space-y-4">
            <h3 className="text-lg font-semibold text-red-400">Delete Account</h3>
            <p className="text-sm text-muted">This action cannot be undone.</p>
            <Field
              label="Confirm current password"
              value={deletePassword}
              onChange={setDeletePassword}
              type={showDeletePassword ? "text" : "password"}
              action={
                <button
                  type="button"
                  onClick={() => setShowDeletePassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-card2 hover:text-white"
                  aria-label={showDeletePassword ? "Hide password" : "Show password"}
                >
                  {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
            <div className="flex items-center gap-3">
              <Button
                type="submit"
                disabled={deleteBusy}
                className="border border-red-500/40 bg-red-600 text-white hover:bg-red-700"
              >
                {deleteBusy ? "Deleting..." : "Delete account"}
              </Button>
              {deleteError && <span className="text-sm text-red-400">{deleteError}</span>}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  type = "text",
  action,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  type?: string;
  action?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-muted">{label}</span>
      <div className="relative">
        {textarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand"
          />
        ) : (
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            type={type}
            className={`w-full rounded-lg border border-line bg-card px-3 py-2 text-sm outline-none focus:border-brand ${action ? "pr-12" : ""}`}
          />
        )}
        {action}
      </div>
    </label>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <Field
      label={label}
      value={value}
      onChange={onChange}
      type={visible ? "text" : "password"}
      action={
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-card2 hover:text-white"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}
