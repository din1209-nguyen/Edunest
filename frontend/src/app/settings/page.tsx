"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Clock,
  KeyRound,
  LogIn,
  MonitorSmartphone,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import type { ApiResponse, AuthSession, User } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

type ProfileForm = {
  name: string;
  bio: string;
  avatar: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function getDashboardHref(user: User | null) {
  if (user?.role === "admin") return "/admin/dashboard";
  return "/teacher/dashboard";
}

function formatDateTime(value?: string) {
  if (!value) return "Chưa có dữ liệu";

  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  const apiError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return apiError.response?.data?.message || apiError.message || fallback;
}

export default function SettingsPage() {
  const toast = useToast();
  const { user, isAuthenticated, isLoading, hasBootstrapped, bootstrapAuth, updateUser, logout } = useAuthStore();
  const [profileDraft, setProfileDraft] = useState<ProfileForm | null>(null);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [sessions, setSessions] = useState<AuthSession[]>([]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  useEffect(() => {
    let cancelled = false;

    async function loadSessions() {
      if (!isAuthenticated) return;

      setIsLoadingSessions(true);
      try {
        const response = await api.get<ApiResponse<{ sessions: AuthSession[] }>>("/auth/sessions");
        if (!cancelled) setSessions(response.data.data?.sessions ?? []);
      } catch (error) {
        if (!cancelled) {
          toast.error(getErrorMessage(error, "Không thể tải danh sách phiên đăng nhập."));
        }
      } finally {
        if (!cancelled) setIsLoadingSessions(false);
      }
    }

    loadSessions();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, toast]);

  const currentSession = useMemo(() => sessions.find((session) => session.isCurrent), [sessions]);
  const otherSessions = useMemo(() => sessions.filter((session) => !session.isCurrent), [sessions]);
  const profileForm = profileDraft ?? {
    name: user?.name || "",
    bio: user?.bio || "",
    avatar: user?.avatar || "",
  };

  const updateProfileDraft = (updates: Partial<ProfileForm>) => {
    setProfileDraft((current) => ({
      name: current?.name ?? user?.name ?? "",
      bio: current?.bio ?? user?.bio ?? "",
      avatar: current?.avatar ?? user?.avatar ?? "",
      ...updates,
    }));
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profileForm.name.trim()) {
      toast.error("Vui lòng nhập tên hiển thị.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await api.patch<ApiResponse<{ user: User }>>("/auth/profile", {
        name: profileForm.name.trim(),
        bio: profileForm.bio.trim(),
        avatar: profileForm.avatar.trim(),
      });
      const updatedUser = response.data.data?.user;

      if (updatedUser) {
        updateUser(updatedUser);
        setProfileDraft(null);
      }
      toast.success("Đã cập nhật hồ sơ.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể cập nhật hồ sơ."));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Đã đổi mật khẩu. Vui lòng đăng nhập lại.");
      await logout();
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể đổi mật khẩu."));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      setSessions((current) => current.filter((session) => session._id !== sessionId));
      toast.success("Đã đăng xuất phiên này.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể đăng xuất phiên này."));
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeOtherSessions = async () => {
    setRevokingSessionId("others");
    try {
      await api.delete("/auth/sessions");
      setSessions((current) => current.filter((session) => session.isCurrent));
      toast.success("Đã đăng xuất các thiết bị khác.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Không thể đăng xuất các thiết bị khác."));
    } finally {
      setRevokingSessionId(null);
    }
  };

  if (isLoading || !hasBootstrapped) {
    return (
      <main className="mx-auto min-h-[calc(100vh-220px)] max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Đang tải cài đặt...</CardContent>
        </Card>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <main className="mx-auto min-h-[calc(100vh-220px)] max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <LogIn className="h-5 w-5" />
            </div>
            <CardTitle>Cần đăng nhập để mở cài đặt</CardTitle>
            <CardDescription>Đăng nhập vào tài khoản Edunest để cập nhật hồ sơ và bảo mật.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild leftIcon={<LogIn className="h-4 w-4" />}>
              <Link href="/login">Đăng nhập</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-220px)] max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-primary-700">Tài khoản</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground sm:text-3xl">Cài đặt tài khoản</h1>
          <p className="mt-2 text-sm text-muted-foreground">Quản lý hồ sơ, mật khẩu và các phiên đăng nhập.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={getDashboardHref(user)}>Về bảng điều khiển</Link>
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary-600" />
                Hồ sơ cá nhân
              </CardTitle>
              <CardDescription>Thông tin này hiển thị trong các khu vực học tập và giảng dạy.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleProfileSubmit}>
                <div className="flex items-center gap-4 rounded-lg border border-border bg-surface/50 p-4">
                  <Avatar src={profileForm.avatar} name={profileForm.name || user.email} size="xl" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="primary-light">{user.role === "admin" ? "Admin" : "User"}</Badge>
                      <Badge variant={user.isEmailVerified === false ? "warning" : "success"}>
                        {user.isEmailVerified === false ? "Chưa xác minh email" : "Đã xác minh email"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Input
                  label="Tên hiển thị"
                  value={profileForm.name}
                  onChange={(event) => updateProfileDraft({ name: event.target.value })}
                  required
                  maxLength={100}
                />
                <Input
                  label="Avatar URL"
                  value={profileForm.avatar}
                  onChange={(event) => updateProfileDraft({ avatar: event.target.value })}
                  placeholder="https://..."
                />
                <Textarea
                  label="Giới thiệu"
                  value={profileForm.bio}
                  onChange={(event) => updateProfileDraft({ bio: event.target.value })}
                  maxLength={500}
                  placeholder="Viết ngắn gọn về bạn..."
                />
                <div className="flex justify-end">
                  <Button type="submit" isLoading={isSavingProfile} leftIcon={<Save className="h-4 w-4" />}>
                    Lưu hồ sơ
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-primary-600" />
                Đổi mật khẩu
              </CardTitle>
              <CardDescription>Sau khi đổi mật khẩu, các phiên đăng nhập sẽ được đăng xuất.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={handlePasswordSubmit}>
                <Input
                  className="sm:col-span-2"
                  label="Mật khẩu hiện tại"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                  required
                />
                <Input
                  label="Mật khẩu mới"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))}
                  hint="Tối thiểu 8 ký tự, có chữ hoa và số."
                  required
                />
                <Input
                  label="Nhập lại mật khẩu mới"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                  required
                />
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" variant="secondary" isLoading={isChangingPassword} leftIcon={<ShieldCheck className="h-4 w-4" />}>
                    Đổi mật khẩu
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-primary-600" />
                Tổng quan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-surface/60 px-3 py-2">
                <span className="text-muted-foreground">Email</span>
                <span className="truncate font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-surface/60 px-3 py-2">
                <span className="text-muted-foreground">Ngày tạo</span>
                <span className="font-medium text-foreground">{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-surface/60 px-3 py-2">
                <span className="text-muted-foreground">Cập nhật</span>
                <span className="font-medium text-foreground">{formatDateTime(user.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-primary-600" />
                Phiên đăng nhập
              </CardTitle>
              <CardDescription>Kiểm tra và đăng xuất các thiết bị khác khi cần.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingSessions ? (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Đang tải phiên đăng nhập...
                </div>
              ) : (
                <>
                  {currentSession ? (
                    <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-primary-900">{currentSession.deviceLabel}</p>
                          <p className="mt-1 text-xs text-primary-800">{currentSession.ip || "Không rõ IP"}</p>
                        </div>
                        <Badge variant="primary-light">Hiện tại</Badge>
                      </div>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-primary-800">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(currentSession.lastSeenAt)}
                      </p>
                    </div>
                  ) : null}

                  {otherSessions.length > 0 ? (
                    <div className="space-y-2">
                      {otherSessions.map((session) => (
                        <div key={session._id} className="rounded-lg border border-border bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">{session.deviceLabel}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{session.ip || "Không rõ IP"}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(session.lastSeenAt)}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Đăng xuất phiên"
                              title="Đăng xuất phiên"
                              isLoading={revokingSessionId === session._id}
                              onClick={() => handleRevokeSession(session._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        isLoading={revokingSessionId === "others"}
                        onClick={handleRevokeOtherSessions}
                      >
                        Đăng xuất tất cả thiết bị khác
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      Không có thiết bị khác đang hoạt động.
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
