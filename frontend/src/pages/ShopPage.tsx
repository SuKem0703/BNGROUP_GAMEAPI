import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Coins, Sparkles, ShoppingBag, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getShopItems, buyShopItem } from '@/api/shop';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { useToast } from '@/hooks/useToast';
import { getItemCategoryLabel } from '@/utils/itemCatalog';
import { formatDateTime, formatNumber } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';
import type { ShopItem } from '@/types/shop';

export function ShopPage() {
  const [search, setSearch] = useState('');
  const [quantityMap, setQuantityMap] = useState<Record<number, string>>({});
  const toast = useToast();

  const shopQuery = useQuery<ShopItem[], Error>({
    queryKey: ['shop-items', search],
    queryFn: () => getShopItems(search),
  });

  const buyMutation = useMutation<unknown, Error, { itemId: number; quantity: number }>({
    mutationFn: ({ itemId, quantity }) => buyShopItem(itemId, quantity),
    onSuccess: () => {
      toast.success('Mua thành công!');
      shopQuery.refetch();
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const items = shopQuery.data ?? [];

  const totalValue = useMemo(
    () => items.reduce((sum: number, item: ShopItem) => sum + item.buyPrice, 0),
    [items],
  );

  const handleQuantityChange = (itemId: number, value: string) => {
    setQuantityMap((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleBuy = (item: ShopItem) => {
    const rawQuantity = quantityMap[item.id] ?? '1';
    const quantity = item.isStackable ? Number(rawQuantity) || 1 : 1;

    if (quantity <= 0) {
      toast.error('Số lượng phải lớn hơn 0');
      return;
    }

    buyMutation.mutate({ itemId: item.id, quantity });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Shop"
        title="Marketplace"
        description="Mua item trực tiếp từ web. Hình ảnh vật phẩm sẽ được cập nhật sau khi assets sẵn sàng."
        actions={
          <Link className="btn-secondary" to="/dashboard">
            Back to dashboard
          </Link>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available items"
          value={formatNumber(items.length)}
          helper="Số lượng vật phẩm đang hiển thị theo bộ lọc hiện tại."
          icon={ShoppingBag}
        />
        <StatCard
          title="Price range"
          value={`${formatNumber(items[0]?.buyPrice ?? 0)} - ${formatNumber(items[items.length - 1]?.buyPrice ?? 0)}`}
          helper="Khoảng giá thanh toán cho danh sách này."
          icon={Coins}
          tone="green"
        />
        <StatCard
          title="Total catalog"
          value={`${formatNumber(totalValue)} total`}
          helper="Tổng giá trị của các item đang hiển thị."
          icon={Sparkles}
        />
        <StatCard
          title="Last refreshed"
          value={formatDateTime(new Date().toISOString())}
          helper="Dữ liệu shop mới nhất khi trang được mở."
          icon={Search}
        />
      </section>

      <section className="panel rounded-[32px] border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
          <div>
            <p className="heading-decor text-xs">Market overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Item store</h2>
          </div>
          <input
            className="input-shell w-full max-w-sm"
            placeholder="Search item name, id, description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {shopQuery.isLoading ? (
          <div className="py-14">
            <LoadingSpinner label="Loading shop items..." />
          </div>
        ) : shopQuery.isError ? (
          <ErrorState
            message={normalizeApiError(shopQuery.error).message}
            action={
              <button className="btn-secondary" onClick={() => shopQuery.refetch()} type="button">
                Retry
              </button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No items found"
            description="Thử tìm kiếm khác hoặc trở lại sau khi shop cập nhật." 
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const quantityValue = item.isStackable ? quantityMap[item.id] ?? '1' : '1';
              return (
                <div key={item.id} className="group rounded-[32px] border border-white/10 bg-white/5 p-6 transition hover:border-accent-200/30 hover:bg-white/10">
                  <div className="aspect-[4/3] overflow-hidden rounded-[28px] bg-slate-950/60 p-4 text-center text-slate-400">
                    {item.imageUrl ? (
                      <img
                        className="h-full w-full object-contain"
                        src={item.imageUrl}
                        alt={item.name}
                      />
                    ) : (
                      <div className="mx-auto flex h-full w-full max-w-[140px] flex-col items-center justify-center gap-3">
                        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/5 text-3xl text-slate-300">
                          #{item.id}
                        </div>
                        <span className="text-sm uppercase tracking-[0.14em] text-slate-400">Asset coming</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading text-xl text-white">{item.name}</h3>
                        <p className="text-sm text-slate-400">{getItemCategoryLabel(item.id)}</p>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-300">
                        {item.currency}
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-300">{item.description || 'No description available yet.'}</p>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm text-slate-400">Price</p>
                        <p className="text-xl font-semibold text-white">{formatNumber(item.buyPrice)}</p>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs uppercase tracking-[0.16em] text-slate-400">Qty</label>
                        <input
                          type="number"
                          min={1}
                          value={quantityValue}
                          disabled={!item.isStackable}
                          className="input-shell w-24"
                          onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                        />
                      </div>
                    </div>

                    <button
                      className="btn-primary w-full"
                      type="button"
                      onClick={() => handleBuy(item)}
                      disabled={buyMutation.status === 'pending'}
                    >
                      Buy now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
