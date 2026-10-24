/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as connections from "../connections.js";
import type * as conversations from "../conversations.js";
import type * as lib_getUser from "../lib/getUser.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_password from "../lib/password.js";
import type * as listings from "../listings.js";
import type * as matches from "../matches.js";
import type * as notifications from "../notifications.js";
import type * as profiles from "../profiles.js";
import type * as reports from "../reports.js";
import type * as users from "../users.js";
import type * as viewings from "../viewings.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  connections: typeof connections;
  conversations: typeof conversations;
  "lib/getUser": typeof lib_getUser;
  "lib/notify": typeof lib_notify;
  "lib/password": typeof lib_password;
  listings: typeof listings;
  matches: typeof matches;
  notifications: typeof notifications;
  profiles: typeof profiles;
  reports: typeof reports;
  users: typeof users;
  viewings: typeof viewings;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
