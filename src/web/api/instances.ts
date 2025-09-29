import type { GetAllInstancesResponseBody } from "../../shared/api.ts"
import { getResource } from "../api.ts"

export const getAllInstances = async (locales: string[]) =>
  getResource<GetAllInstancesResponseBody>("/api/instances", { locales })
