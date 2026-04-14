import "dotenv/config";

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  serviceName: "product_service",
  port: toNumber(process.env.PRODUCT_SERVICE_PORT, 4002),
  databaseUrl:
    process.env.DATABASE_URL ??
    `postgres://${process.env.POSTGRES_USER ?? "postgres"}:${process.env.POSTGRES_PASSWORD ?? "postgres"}@${process.env.POSTGRES_HOST ?? "localhost"}:${process.env.POSTGRES_PORT ?? "5432"}/${process.env.POSTGRES_DB ?? "ecommerce"}`,
  jwtSecret: process.env.JWT_SECRET ?? "local-demo-secret"
};

