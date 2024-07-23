import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.transactions.$post>;
type RequestType = InferRequestType<
  typeof client.api.transactions.$post
>["json"];

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.transactions.$post({ json });
      return await response.json();
    },

    onSuccess: () => {
      toast.success("Transaction created");
      //as the new acc is created fetch acc for fresh data
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      // todo: invalidate summary
    },

    onError: () => {
      toast.error("Failed to create an transaction");
    },
  });

  return mutation;
};
