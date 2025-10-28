import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import {
  SubmitResponseRequest,
  SubmitResponseResult,
  SurveyDto,
  SurveySummaryDto,
  CreateSurveyRequest,
  UpdateSurveyRequest,
} from "@/types";

export function useSurveyList() {
  return useQuery({
    queryKey: ["surveys"],
    queryFn: async (): Promise<SurveySummaryDto[]> => {
      const { data } = await api.get("/api/surveys");
      return data;
    },
  });
}

export function useSurvey(id?: string) {
  return useQuery({
    queryKey: ["survey", id],
    enabled: !!id,
    queryFn: async (): Promise<SurveyDto> => {
      const { data } = await api.get(`/api/surveys/${id}`);
      return data;
    },
  });
}

export function useSubmitResponse(surveyId?: string) {
  return useMutation({
    mutationKey: ["submitResponse", surveyId],
    mutationFn: async (
      payload: SubmitResponseRequest
    ): Promise<SubmitResponseResult> => {
      const { data } = await api.post(
        `/api/surveys/${surveyId}/responses`,
        payload
      );
      return data;
    },
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      payload: CreateSurveyRequest
    ): Promise<{ id: string }> => {
      const { data } = await api.post("/api/surveys", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSurveyRequest;
    }) => {
      await api.put(`/api/surveys/${id}`, payload);
    },
    onSuccess: (_, { id }) => {
      // Invalidate all survey-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      queryClient.invalidateQueries({ queryKey: ["survey", id] });
      queryClient.invalidateQueries({ queryKey: ["survey"] });
      // Remove the specific survey from cache to force refetch
      queryClient.removeQueries({ queryKey: ["survey", id] });
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/surveys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}
