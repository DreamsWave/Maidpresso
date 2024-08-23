import env from "@/env";
import moment from "moment";

export const getExpirationDate = () => {
  if (Bun.env.NODE_ENV === "development") {
    return moment().add(30, "seconds").format("YYYY-MM-DD HH:mm:ss");
  }
  return moment().add(env.SUB_DAYS, "days").format("YYYY-MM-DD HH:mm:ss");
};

export const isExpired = (expiresAt: string) => {
  const expired = moment(expiresAt).isBefore(moment());
  return expired;
};
