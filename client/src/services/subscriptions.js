import api from "../lib/api";

export const getMySubscriptions = () =>
  api.get("/subscriptions/me");
