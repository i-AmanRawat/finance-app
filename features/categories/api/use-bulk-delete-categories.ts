import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.categories)["bulk-delete"]["$post"]
>;
type RequestType = InferRequestType<
  (typeof client.api.categories)["bulk-delete"]["$post"]
>["json"];

export const useBulkDeleteCategories = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.categories["bulk-delete"]["$post"]({
        json,
      });
      return await response.json();
    },

    onSuccess: () => {
      toast.success("Categories Deleted");
      //as the new acc is created fetch acc for fresh data
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      //TODO:Also invalidate summary
    },

    onError: () => {
      toast.error("Failed to delete categories");
    },
  });

  return mutation;
};
