"use client";

import { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { Edit, FolderTree, Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { adminCategoryApi } from "@/lib/adminApi";
import type { Category } from "@/types";

type AdminCategory = Category & {
  isActive?: boolean;
  order?: number;
  image?: string;
};

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  order: string;
  isActive: boolean;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  icon: "book-open",
  order: "0",
  isActive: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function formFromCategory(category: AdminCategory): CategoryForm {
  return {
    name: category.name || "",
    slug: category.slug || "",
    description: category.description || "",
    icon: category.icon || "book-open",
    order: String(category.order ?? 0),
    isActive: category.isActive !== false,
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadCategories() {
    try {
      setIsLoading(true);
      setError("");
      const response = await adminCategoryApi.getAllCategories();
      setCategories((response.data ?? []) as AdminCategory[]);
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể tải danh mục.");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return categories;
    return categories.filter((category) =>
      [category.name, category.slug, category.description]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(keyword)),
    );
  }, [categories, search]);

  function updateForm<K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "name" && !editingId ? { slug: slugify(String(value)) } : {}),
    }));
    setError("");
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit() {
    const name = form.name.trim();
    if (!name) {
      setError("Vui lòng nhập tên danh mục.");
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      const payload = {
        name,
        slug: form.slug.trim() || slugify(name),
        description: form.description.trim(),
        icon: form.icon.trim() || "book-open",
        order: Math.max(Number(form.order) || 0, 0),
        isActive: form.isActive,
      };

      if (editingId) {
        await adminCategoryApi.updateCategory(editingId, payload);
      } else {
        await adminCategoryApi.createCategory(payload);
      }

      resetForm();
      await loadCategories();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể lưu danh mục.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(categoryId: string) {
    try {
      setDeletingId(categoryId);
      setError("");
      await adminCategoryApi.deleteCategory(categoryId);
      await loadCategories();
    } catch (requestError) {
      const axiosError = requestError as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || axiosError.message || "Không thể xóa danh mục.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="content-stack">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý danh mục</h1>
          <p className="page-subtitle">Quản trị danh mục khóa học đang dùng trong MongoDB.</p>
        </div>
        <Button variant="outline" onClick={() => loadCategories()} isLoading={isLoading}>
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <Card className="space-y-4 p-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {editingId ? "Cập nhật danh mục" : "Thêm danh mục"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Slug sẽ tự sinh khi tạo mới và vẫn có thể chỉnh thủ công.
            </p>
          </div>

          <Input label="Tên danh mục" value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
          <Input label="Slug" value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} />
          <Textarea label="Mô tả" value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Icon" value={form.icon} onChange={(event) => updateForm("icon", event.target.value)} />
            <Input label="Thứ tự" type="number" min={0} value={form.order} onChange={(event) => updateForm("order", event.target.value)} />
          </div>
          <label className="flex items-center gap-3 rounded-lg border border-border bg-surface/60 p-3 text-sm text-foreground">
            <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} />
            Hiển thị danh mục
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} isLoading={isSaving} leftIcon={editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}>
              {editingId ? "Lưu thay đổi" : "Tạo danh mục"}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm} leftIcon={<X className="h-4 w-4" />}>
                Hủy
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Danh sách danh mục</h2>
              <p className="mt-1 text-sm text-muted-foreground">{filteredCategories.length} danh mục</p>
            </div>
            <Input
              className="sm:w-72"
              leftIcon={<Search className="h-4 w-4" />}
              placeholder="Tìm danh mục..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Đang tải danh mục...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-12 text-center">
              <FolderTree className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">Không có danh mục phù hợp.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[44rem] w-full">
                <thead className="border-b border-border bg-surface">
                  <tr>
                    <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">Danh mục</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">Slug</th>
                    <th className="px-3 py-3 text-left text-sm font-medium text-muted-foreground">Trạng thái</th>
                    <th className="px-3 py-3 text-right text-sm font-medium text-muted-foreground">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCategories.map((category) => (
                    <tr key={category._id} className="hover:bg-surface">
                      <td className="px-3 py-3">
                        <p className="font-medium text-foreground">{category.name}</p>
                        {category.description && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{category.description}</p>}
                      </td>
                      <td className="px-3 py-3 text-sm text-muted-foreground">{category.slug}</td>
                      <td className="px-3 py-3">
                        <Badge variant={category.isActive === false ? "secondary-light" : "success"}>
                          {category.isActive === false ? "Ẩn" : "Hiển thị"}
                        </Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon-sm" onClick={() => { setEditingId(category._id); setForm(formFromCategory(category)); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="text-error" onClick={() => handleDelete(category._id)} isLoading={deletingId === category._id}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
