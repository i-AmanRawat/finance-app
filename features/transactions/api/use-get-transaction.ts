import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";
import { convertAmountFromMiliUnits } from "@/lib/utils";

export const useGetTransaction = (id?: string) => {
  const query = useQuery({
    enabled: !!id, //if id is there it will be enabled
    queryKey: ["transaction", { id }],
    queryFn: async () => {
      const response = await client.api.transactions[":id"].$get({
        param: { id },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch individual transaction");
      }

      const { data } = await response.json();
      data["amount"] = convertAmountFromMiliUnits(data.amount);
      return data;
    },
  });
  return query;
};
