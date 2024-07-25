import { z } from "zod";
import { Loader2 } from "lucide-react";

import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";
import { useCreateTransaction } from "@/features/transactions/api/use-create-transaction";

import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCreateCategory } from "@/features/categories/api/use-create-category";

import { useCreateAccount } from "@/features/accounts/api/use-create-account";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { TransactionForm } from "@/features/transactions/components/transaction-form";

import { insertTransactionSchema } from "@/db/schema";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";

const formSchema = insertTransactionSchema.omit({
  id: true,
}); //Zod schema using which zod will validate

type FormValues = z.input<typeof formSchema>;

export const NewTransactionSheet = () => {
  const { isOpen, onClose } = useNewTransaction();
  const { mutate: createTransaction, isPending: createTransIsPending } =
    useCreateTransaction();

  const { mutate: createCategory, isPending: createCatIsPending } =
    useCreateCategory();
  const { data: categories, isLoading: getCatIsLoading } = useGetCategories();
  const onCreateCategory = (name: string) => createCategory({ name });
  const categoryOptions = (categories ?? []).map((category) => ({
    //double ?? -> nullish coalescing operator.
    label: category.name,
    value: category.id,
  }));

  const { mutate: createAccount, isPending: createAccIsPending } =
    useCreateAccount();
  const { data: accounts, isLoading: getAccIsLoading } = useGetAccounts();
  const onCreateAccount = (name: string) => createAccount({ name });
  const accountOptions = (accounts ?? []).map((account) => ({
    //double ?? -> nullish coalescing operator.
    label: account.name,
    value: account.id,
  }));

  const isPending =
    createAccIsPending || createCatIsPending || createTransIsPending;

  const isLoading = getAccIsLoading || getCatIsLoading;

  const onSubmit = (values: FormValues) => {
    createTransaction(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>New Transaction</SheetTitle>
          <SheetDescription>Add new transaction</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <TransactionForm
            onSubmit={onSubmit}
            disabled={isPending}
            categoryOptions={categoryOptions}
            onCreateCategory={onCreateCategory}
            accountOptions={accountOptions}
            onCreateAccount={onCreateAccount}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
