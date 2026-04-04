import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart } from 'lucide-react';
import { getAdminShopLogs } from '@/api/admin';
import { AdminSectionNav } from '@/components/AdminSectionNav';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { formatDateTime, formatNumber } from '@/utils/format';
import { normalizeApiError } from '@/utils/normalize';

export function AdminShopLogsPage() {
  const [search, setSearch] = useState('');

  const shopLogsQuery = useQuery({
    queryKey: ['admin-shoplogs', search],
    queryFn: () => getAdminShopLogs(search),
  });

  const logs = shopLogsQuery.data?.logs ?? [];
  const summary = shopLogsQuery.data?.summary;

  if (shopLogsQuery.isLoading) {
    return <LoadingSpinner label="Loading shop logs..." />;
  }

  if (shopLogsQuery.isError) {
    return (
      <ErrorState
        message={normalizeApiError(shopLogsQuery.error).message}
        action={
          <button className="btn-secondary" onClick={() => shopLogsQuery.refetch()} type="button">
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
        title="Shop Logs"
        description="Audit player shop purchases and review item purchases, currency spent, and purchase timestamps."
        actions={<AdminSectionNav />}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Purchases"
          value={formatNumber(summary?.totalShopPurchases ?? 0)}
          helper="Total shop purchases returned by the current filter."
          icon={ShoppingCart}
        />
        <StatCard
          title="Revenue"
          value={formatNumber(summary?.totalShopRevenue ?? 0)}
          helper="Total amount spent across all matching shop logs."
          icon={ShoppingCart}
          tone="green"
        />
        <StatCard
          title="Latest entry"
          value={logs[0] ? formatDateTime(logs[0].date) : '—'}
          helper="Most recent shop purchase in the current result set."
          icon={ShoppingCart}
        />
        <StatCard
          title="Search"
          value="Filter"
          helper="Search by account id, item name, or currency."
          icon={ShoppingCart}
        />
      </section>

      <section className="panel overflow-hidden rounded-[32px] border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate-950/40 px-6 py-5">
          <div>
            <p className="heading-decor text-xs">Shop Audit</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Purchase history</h2>
          </div>
          <input
            className="input-shell w-full max-w-xs"
            placeholder="Search account, item, currency..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {logs.length === 0 ? (
          <div className="p-10">
            <EmptyState
              title="No shop purchases found"
              description="Adjust the search or return after more shop activity has occurred."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Account</th>
                  <th className="px-6 py-4 font-medium">Item</th>
                  <th className="px-6 py-4 font-medium">Qty</th>
                  <th className="px-6 py-4 font-medium">Price</th>
                  <th className="px-6 py-4 font-medium">Currency</th>
                  <th className="px-6 py-4 font-medium">Total</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4 text-slate-200">{log.accountId}</td>
                    <td className="px-6 py-4 text-slate-200">{log.itemName}</td>
                    <td className="px-6 py-4 text-slate-200">{formatNumber(log.quantity)}</td>
                    <td className="px-6 py-4 text-slate-200">{formatNumber(log.priceAtMoment)}</td>
                    <td className="px-6 py-4 text-slate-200">{log.currency}</td>
                    <td className="px-6 py-4 text-slate-200">{formatNumber(log.totalCost)}</td>
                    <td className="px-6 py-4 text-slate-200">{formatDateTime(log.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
