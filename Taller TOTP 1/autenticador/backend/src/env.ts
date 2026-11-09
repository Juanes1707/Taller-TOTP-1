export const environment = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 4100),
  jwtSecret: process.env.JWT_SECRET ?? "",
  accessTokenSeconds: Number(process.env.ACCESS_TOKEN_TTL ?? 30)
};
