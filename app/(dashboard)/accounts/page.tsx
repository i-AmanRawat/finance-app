"use client";

import { Loader2, Plus } from "lucide-react";

import { useNewAccount } from "@/features/accounts/hooks/use-new-account";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useBulkDeleteAccounts } from "@/features/accounts/api/use-bulk-delete-accounts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { columns } from "./columns";
import { DataTable } from "@/components/data-table";
import { Skeleton } from "@/components/ui/skeleton";

const AccountsPage = () => {
  const { onOpen } = useNewAccount();
  const { mutate: bulkDeleteAccounts, isPending } = useBulkDeleteAccounts();
  const { data, isLoading } = useGetAccounts();
  const accounts = data || [];
  const isDisabled = isPending || isLoading; //wheater bulk-deleting or fetching accounts if res is pending keep it disabled

  if (isLoading) {
    return (
      <div className=" max-w-screen-2xl mx-auto w-full pb-10 -mt-12">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className="w-48 h-8" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center ">
              <Loader2 className="size-6 text-slate-300 animate-spin" />
              <Skeleton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className=" max-w-screen-2xl mx-auto w-full pb-10 -mt-12">
      <Card className="border-none drop-shadow-sm">
        {/* <CardHeader className="gap-y-2 sm:flex-row sm:items-center sm:justify-between"> */}
        <CardHeader className="gap-y-2 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Account&apos;s page
          </CardTitle>
          <Button size="sm" onClick={onOpen}>
            <Plus className="size-4 mr-2" />
            Add new
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={accounts}
            filterKey="email"
            onDelete={(row) => {
              const ids = row.map((r) => r.original.id);
              bulkDeleteAccounts({ ids });
            }}
            disabled={isDisabled}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsPage;