import { z } from "zod";
import { Loader2 } from "lucide-react";

import { TransactionForm } from "@/features/transactions/components/transaction-form";

import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";
import { useGetTransaction } from "@/features/transactions/api/use-get-transaction";
import { useEditTransaction } from "@/features/transactions/api/use-edit-transaction";
import { useDeleteTransaction } from "@/features/transactions/api/use-delete-transaction";

import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useCreateCategory } from "@/features/categories/api/use-create-category";

import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";

import { useConfirm } from "@/hooks/use-confirm";
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

export const EditTransactionSheet = () => {
  const { id, isOpen, onClose } = useOpenTransaction();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this transaction."
  );

  const { data: transaction, isLoading: getTransIsLoading } =
    useGetTransaction(id); //fetch acc by id
  const { mutate: editTransaction, isPending: editTransIsPending } =
    useEditTransaction(id);
  const { mutate: deleteTransaction, isPending: deleteTransIsPending } =
    useDeleteTransaction(id);

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
    editTransIsPending ||
    deleteTransIsPending ||
    // getTransIsLoading ||
    createCatIsPending ||
    createAccIsPending;
  //

  const isLoading = getTransIsLoading || getCatIsLoading || getAccIsLoading;

  const defaultValues = transaction
    ? {
        accountId: transaction.accountId ?? "",
        categoryId: transaction.categoryId,
        amount: transaction.amount.toString(),
        date: transaction.date ? new Date(transaction.date) : new Date(),
        payee: transaction.payee,
        notes: transaction.notes,
      }
    : {
        accountId: "",
        categoryId: "",
        amount: "",
        date: new Date(),
        payee: "",
        notes: "",
      };

  const onSubmit = (values: FormValues) => {
    editTransaction(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const onDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteTransaction(undefined, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Transaction</SheetTitle>
            <SheetDescription>Edit an existing transaction</SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-4 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <TransactionForm
              id={id}
              onSubmit={onSubmit}
              disabled={isPending}
              defaultValues={defaultValues}
              onDelete={onDelete}
              categoryOptions={categoryOptions}
              onCreateCategory={onCreateCategory}
              accountOptions={accountOptions}
              onCreateAccount={onCreateAccount}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};

/*
isLoading -> query -> load the form when data that will be displayed on the form is fetched -> fetching data
isPending -> mutation -> disable for if the mutation isPending -> create update delete 
*/
