"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Avatar } from "@/components/ui/Avatar";
import { adminUserApi } from "@/lib/adminApi";
import { Search, User, Shield, GraduationCap, CheckCircle, XCircle, Lock, Unlock } from "lucide-react";
import type { User as UserType } from "@/types";

type AdminUser = UserType & {
  isActive?: boolean;
};

const roleConfig = {
  admin: { label: "Quản trị", color: "bg-error text-white", icon: Shield },
  user: { label: "Người dùng", color: "bg-primary-600 text-white", icon: User },
};

const filterOptions = [
  { value: "all", label: "Tất cả vai trò" },
  { value: "admin", label: "Quản trị viên" },
  { value: "user", label: "Người dùng" },
];

const statusOptions = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Bị khóa" },
];

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError("");
        const response = await adminUserApi.getAllUsers(
          1,
          50,
          filterRole === "all" ? undefined : filterRole,
          searchQuery || undefined
        );

        if (!mounted) return;

        const loadedUsers = (response.data ?? []) as AdminUser[];
        setUsers(
          loadedUsers.filter((user) => {
            if (filterStatus === "active") return user.isActive !== false;
            if (filterStatus === "inactive") return user.isActive === false;
            return true;
          })
        );
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load admin users", err);
        setError("Không thể tải danh sách người dùng. Hãy đăng nhập admin và thử lại.");
        setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [searchQuery, filterRole, filterStatus]);

  const stats = useMemo(
    () => ({
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      learners: users.filter((user) => user.role === "user").length,
      active: users.filter((user) => user.isActive !== false).length,
      inactive: users.filter((user) => user.isActive === false).length,
    }),
    [users]
  );

  async function toggleUserStatus(user: AdminUser) {
    try {
      const response =
        user.isActive === false
          ? await adminUserApi.unbanUser(user._id)
          : await adminUserApi.banUser(user._id, "Locked by admin");
      const updated = response.data as AdminUser | undefined;
      if (updated) {
        setUsers((current) =>
          current.map((item) => (item._id === updated._id ? { ...item, ...updated } : item))
        );
      }
    } catch (err) {
      console.error("Failed to update user status", err);
      setError("Không thể cập nhật trạng thái người dùng.");
    }
  }

  return (
    <div className="content-stack">
      <div>
        <div className="page-header mb-6">
          <div>
            <h1 className="page-title">Quản lý người dùng</h1>
            <p className="page-subtitle">Dữ liệu người dùng thật từ MongoDB</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Tổng người dùng", value: stats.total, icon: GraduationCap, color: "bg-primary-100 text-primary-600" },
            { label: "Quản trị", value: stats.admins, icon: Shield, color: "bg-error-light text-error" },
            { label: "Người dùng", value: stats.learners, icon: User, color: "bg-secondary-100 text-secondary-600" },
            { label: "Hoạt động", value: stats.active, icon: CheckCircle, color: "bg-success-light text-success" },
            { label: "Bị khóa", value: stats.inactive, icon: XCircle, color: "bg-warning-light text-warning" },
          ].map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <div className="relative w-full sm:max-w-md">
              <Input
                placeholder="Tìm kiếm theo tên, email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select value={filterRole} onChange={setFilterRole} options={filterOptions} className="w-full sm:w-40" />
            <Select value={filterStatus} onChange={setFilterStatus} options={statusOptions} className="w-full sm:w-44" />
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-[48rem] w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Người dùng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Vai trò</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Trạng thái</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ngày tạo</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  users.map((user) => {
                    const role = roleConfig[user.role as keyof typeof roleConfig] ?? roleConfig.user;
                    const RoleIcon = role.icon;
                    const active = user.isActive !== false;
                    return (
                      <tr key={user._id} className="border-b border-border last:border-0 hover:bg-surface">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar src={user.avatar} name={user.name} size="sm" />
                            <div>
                              <p className="font-medium text-foreground">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={role.color}>
                            <RoleIcon className="mr-1 h-3 w-3" />
                            {role.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={active ? "bg-success text-white" : "bg-muted text-white"}>
                            {active ? "Hoạt động" : "Bị khóa"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleUserStatus(user)}
                            >
                              {active ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {(loading || users.length === 0) && (
            <div className="p-12 text-center">
              <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {loading ? "Đang tải người dùng..." : "Không tìm thấy người dùng"}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {loading ? "Đang đọc dữ liệu từ MongoDB" : "Không có người dùng nào phù hợp với điều kiện tìm kiếm"}
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
