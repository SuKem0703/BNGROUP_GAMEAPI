import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, RefreshCw, Search } from 'lucide-react';
import { AdminSectionNav } from '@/components/AdminSectionNav';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { useToast } from '@/hooks/useToast';
import { getItemCategoryLabel } from '@/utils/itemCatalog';
import { formatNumber } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';
import { createAdminShopItem, deleteAdminShopItem, getAdminShopItems, updateAdminShopItem, uploadAdminShopItemImage } from '@/api/admin';
import type { ShopItem } from '@/types/shop';

export function AdminShopItemsPage() {
  const [search, setSearch] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Record<number, File | null>>({});
  const queryClient = useQueryClient();
  const toast = useToast();

  const ITEM_TYPES = ['QuestItem', 'Equipment', 'Consumable', 'Seed', 'Material'] as const;
  const CURRENCY_OPTIONS = ['Coin', 'Gem'] as const;

  const shopItemsQuery = useQuery<ShopItem[]>({
    queryKey: ['admin-shop-items', search],
    queryFn: () => getAdminShopItems(search),
  });

  const [itemDrafts, setItemDrafts] = useState<Record<number, Partial<ShopItem>>>({});
  const [newItem, setNewItem] = useState({
    id: '',
    name: '',
    description: '',
    itemType: 'Equipment',
    isStackable: true,
    rarity: '1',
    buyPrice: '0',
    sellPrice: '0',
    currency: 'Coin',
  });

  const uploadMutation = useMutation({
    mutationFn: ({ itemId, imageBase64, filename }: { itemId: number; imageBase64: string; filename?: string }) =>
      uploadAdminShopItemImage(itemId, { imageBase64, filename }),
    onSuccess: async () => {
      toast.success('Hình ảnh item đã được cập nhật.');
      setSelectedFiles({});
      await queryClient.invalidateQueries({ queryKey: ['admin-shop-items'] });
      await queryClient.invalidateQueries({ queryKey: ['shop-items'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: Partial<ShopItem> }) =>
      updateAdminShopItem(itemId, payload),
    onSuccess: async () => {
      toast.success('Item updated successfully.');
      await queryClient.invalidateQueries({ queryKey: ['admin-shop-items'] });
      await queryClient.invalidateQueries({ queryKey: ['shop-items'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => deleteAdminShopItem(itemId),
    onSuccess: async () => {
      toast.success('Item deleted successfully.');
      await queryClient.invalidateQueries({ queryKey: ['admin-shop-items'] });
      await queryClient.invalidateQueries({ queryKey: ['shop-items'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      id: number;
      name: string;
      description?: string | null;
      itemType: string;
      isStackable: boolean;
      rarity: number;
      buyPrice: number;
      sellPrice: number;
      currency: string;
    }) => createAdminShopItem(payload),
    onSuccess: async () => {
      toast.success('Item created successfully.');
      setNewItem({
        id: '',
        name: '',
        description: '',
        itemType: 'Equipment',
        isStackable: true,
        rarity: '1',
        buyPrice: '0',
        sellPrice: '0',
        currency: 'Coin',
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-shop-items'] });
      await queryClient.invalidateQueries({ queryKey: ['shop-items'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const shopItems = shopItemsQuery.data ?? [];
  const totalItems = useMemo(() => shopItems.length, [shopItems]);
  const imageCount = useMemo(() => shopItems.filter((item) => !!item.imageUrl).length, [shopItems]);

  const handleFileSelect = (itemId: number, file: File | null) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [itemId]: file,
    }));
  };

  const setDraftValue = (itemId: number, field: keyof ShopItem, value: unknown) => {
    setItemDrafts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleCreateItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newItem.id || !newItem.name) {
      toast.error('ID và tên item là bắt buộc.');
      return;
    }

    createMutation.mutate({
      id: Number(newItem.id),
      name: newItem.name,
      description: newItem.description || null,
      itemType: newItem.itemType,
      isStackable: newItem.isStackable,
      rarity: Number(newItem.rarity),
      buyPrice: Number(newItem.buyPrice),
      sellPrice: Number(newItem.sellPrice),
      currency: newItem.currency,
    });
  };

  const handleUpload = async (itemId: number) => {
    const file = selectedFiles[itemId];
    if (!file) {
      toast.error('Vui lòng chọn file ảnh trước khi tải lên.');
      return;
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Chỉ chấp nhận ảnh PNG, JPG, JPEG hoặc GIF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result ?? '').replace(/^data:[^;]+;base64,/, '');
      uploadMutation.mutate({ itemId, imageBase64: base64, filename: file.name });
    };
    reader.onerror = () => {
      toast.error('Không thể đọc file ảnh.');
    };
    reader.readAsDataURL(file);
  };

  if (shopItemsQuery.isLoading) {
    return <LoadingSpinner label="Loading shop item image tools..." />;
  }

  if (shopItemsQuery.isError) {
    return (
      <ErrorState
        message={normalizeApiError(shopItemsQuery.error).message}
        action={
          <button className="btn-secondary" onClick={() => shopItemsQuery.refetch()} type="button">
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin Console"
        title="Shop Item Management"
        description="Tạo, sửa, xóa và cập nhật ảnh cho vật phẩm shop trực tiếp từ giao diện admin."
        actions={<AdminSectionNav />}
      />

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[32px] border border-white/10 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="heading-decor text-xs">Create item</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">New shop item</h2>
            </div>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleCreateItem}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm text-slate-300">
                <span>ID</span>
                <input
                  type="number"
                  min={1}
                  value={newItem.id}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, id: event.target.value }))}
                  className="input-shell w-full"
                />
              </label>
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Name</span>
                <input
                  value={newItem.name}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
                  className="input-shell w-full"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Type</span>
                <select
                  value={newItem.itemType}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, itemType: event.target.value }))}
                  className="input-shell w-full"
                >
                  {ITEM_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Currency</span>
                <select
                  value={newItem.currency}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, currency: event.target.value }))}
                  className="input-shell w-full"
                >
                  {CURRENCY_OPTIONS.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Buy Price</span>
                <input
                  type="number"
                  min={0}
                  value={newItem.buyPrice}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, buyPrice: event.target.value }))}
                  className="input-shell w-full"
                />
              </label>
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Sell Price</span>
                <input
                  type="number"
                  min={0}
                  value={newItem.sellPrice}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, sellPrice: event.target.value }))}
                  className="input-shell w-full"
                />
              </label>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Rarity</span>
                <input
                  type="number"
                  min={0}
                  value={newItem.rarity}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, rarity: event.target.value }))}
                  className="input-shell w-full"
                />
              </label>
              <label className="block space-y-2 text-sm text-slate-300">
                <span>Stackable</span>
                <select
                  value={String(newItem.isStackable)}
                  onChange={(event) => setNewItem((prev) => ({ ...prev, isStackable: event.target.value === 'true' }))}
                  className="input-shell w-full"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
            </div>
            <label className="block space-y-2 text-sm text-slate-300">
              <span>Description</span>
              <textarea
                value={newItem.description}
                onChange={(event) => setNewItem((prev) => ({ ...prev, description: event.target.value }))}
                className="input-shell min-h-[100px] w-full"
              />
            </label>
            <button type="submit" className="btn-primary">
              Create item
            </button>
          </form>
        </div>
      </section>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search shop items"
          className="input-shell w-full max-w-sm"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          className="btn-secondary"
          type="button"
          onClick={() => shopItemsQuery.refetch()}
        >
          Refresh list
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Shop items"
          value={formatNumber(totalItems)}
          helper="Tổng số item trong cửa hàng."
          icon={ImagePlus}
        />
        <StatCard
          title="Has images"
          value={formatNumber(imageCount)}
          helper="Số item đã có ảnh hiển thị."
          icon={RefreshCw}
          tone="green"
        />
        <StatCard
          title="Pending uploads"
          value={formatNumber(Object.values(selectedFiles).filter(Boolean).length)}
          helper="File đang chờ upload."
          icon={Search}
          tone="blue"
        />
      </section>

      {shopItems.length === 0 ? (
        <EmptyState
          title="No shop items found"
          description="Không có item nào trong danh sách shop."
        />
      ) : (
        <section className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shopItems.map((item) => {
              const selectedFile = selectedFiles[item.id];
              const draft: ShopItem = {
                ...item,
                ...itemDrafts[item.id],
              };
              return (
                <div key={item.id} className="panel rounded-[32px] border border-white/10 p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm uppercase tracking-[0.16em] text-slate-400">{getItemCategoryLabel(item.id)}</p>
                        <h3 className="mt-1 text-lg font-semibold text-white">{item.name}</h3>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">
                        {item.currency}
                      </span>
                    </div>

                    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                      {item.imageUrl ? (
                        <img
                          className="h-32 w-full rounded-3xl object-contain"
                          src={item.imageUrl}
                          alt={item.name}
                        />
                      ) : (
                        <div className="flex h-32 items-center justify-center rounded-3xl bg-slate-900 text-slate-500">
                          No image yet
                        </div>
                      )}
                    </div>

                    <p className="text-sm leading-6 text-slate-300">{draft.description || 'No description provided.'}</p>

                    <div className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-300">
                          Name
                          <input
                            type="text"
                            value={draft.name}
                            onChange={(event) => setDraftValue(item.id, 'name', event.target.value)}
                            className="input-shell w-full"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-300">
                          Buy Price
                          <input
                            type="number"
                            min={0}
                            value={draft.buyPrice ?? 0}
                            onChange={(event) => setDraftValue(item.id, 'buyPrice', Number(event.target.value))}
                            className="input-shell w-full"
                          />
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-300">
                          Sell Price
                          <input
                            type="number"
                            min={0}
                            value={draft.sellPrice ?? 0}
                            onChange={(event) => setDraftValue(item.id, 'sellPrice', Number(event.target.value))}
                            className="input-shell w-full"
                          />
                        </label>
                        <label className="block text-sm font-medium text-slate-300">
                          Rarity
                          <input
                            type="number"
                            min={0}
                            value={draft.rarity ?? 1}
                            onChange={(event) => setDraftValue(item.id, 'rarity', Number(event.target.value))}
                            className="input-shell w-full"
                          />
                        </label>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block text-sm font-medium text-slate-300">
                          Type
                          <select
                            value={draft.itemType}
                            onChange={(event) => setDraftValue(item.id, 'itemType', event.target.value)}
                            className="input-shell w-full"
                          >
                            {ITEM_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm font-medium text-slate-300">
                          Currency
                          <select
                            value={draft.currency}
                            onChange={(event) => setDraftValue(item.id, 'currency', event.target.value)}
                            className="input-shell w-full"
                          >
                            {CURRENCY_OPTIONS.map((currency) => (
                              <option key={currency} value={currency}>
                                {currency}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <label className="block text-sm font-medium text-slate-300">
                        Description
                        <textarea
                          value={draft.description ?? ''}
                          onChange={(event) => setDraftValue(item.id, 'description', event.target.value)}
                          className="input-shell min-h-[80px] w-full"
                        />
                      </label>
                      <label className="block text-sm font-medium text-slate-300">
                        Stackable
                        <select
                          value={String(draft.isStackable)}
                          onChange={(event) => setDraftValue(item.id, 'isStackable', event.target.value === 'true')}
                          className="input-shell w-full"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-300">
                        Choose image
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/gif"
                          className="mt-2 block w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
                          onChange={(event) => handleFileSelect(item.id, event.target.files?.[0] ?? null)}
                        />
                      </label>
                      {selectedFile ? (
                        <p className="text-sm text-slate-400">Selected: {selectedFile.name}</p>
                      ) : null}
                      <button
                        className="btn-primary w-full"
                        type="button"
                        onClick={() => handleUpload(item.id)}
                        disabled={uploadMutation.status === 'pending'}
                      >
                        Upload image
                      </button>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <button
                          className="btn-secondary w-full"
                          type="button"
                          onClick={() => {
                            const draft = itemDrafts[item.id] ?? item;
                            updateMutation.mutate({
                              itemId: item.id,
                              payload: {
                                name: draft.name,
                                description: draft.description,
                                itemType: draft.itemType,
                                isStackable: draft.isStackable,
                                rarity: draft.rarity,
                                buyPrice: draft.buyPrice,
                                sellPrice: draft.sellPrice,
                                currency: draft.currency,
                              },
                            });
                          }}
                          disabled={updateMutation.status === 'pending'}
                        >
                          Save
                        </button>
                        <button
                          className="btn-ghost w-full text-rose-300"
                          type="button"
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.status === 'pending'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
