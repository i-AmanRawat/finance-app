import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { client } from "@/lib/hono";
import { convertAmountFromMiliUnits } from "@/lib/utils";

export const useGetTransactions = () => {
  const params = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const accountId = params.get("accountId") || "";

  const query = useQuery({
    //TODO: check if params are needed in the key
    queryKey: ["transactions", { from, to, accountId }],
    queryFn: async () => {
      const response = await client.api.transactions.$get({
        query: {
          from,
          to,
          accountId,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transaction");
      }

      const { data } = await response.json();

      //before return converting the amount property back to normal from miliunits
      return data.map((transaction) => {
        const formattedAmount = convertAmountFromMiliUnits(transaction.amount);
        // const formattedAmount = 0;
        return {
          ...transaction,
          amount: formattedAmount,
        };
      });
    },
  });
  return query;
};
