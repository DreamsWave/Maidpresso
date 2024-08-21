import env from "@/env";
import moment from "moment";

export const getExpirationDate = () => {
  if (Bun.env.NODE_ENV === "development") {
    return moment().add(30, "seconds").format("YYYY-MM-DD HH:mm:ss");
  }
  return moment().add(env.SUB_DAYS, "days").format("YYYY-MM-DD HH:mm:ss");
};

export const containsWord = (
  str: string,
  word: string,
  options = { caseSensitive: false }
) => {
  const { caseSensitive } = options;
  const flags = caseSensitive ? "g" : "gi";
  const pattern = `\\b${word}\\b`;
  const regex = new RegExp(pattern, flags);
  return regex.test(str);
};

export const isExpired = (expiresAt: string) => {
  const expired = moment(expiresAt).isBefore(moment());
  return expired;
};
