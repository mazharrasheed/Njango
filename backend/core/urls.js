// core/urls.js

import { blogUrls } from "../apps/blog/urls.js";
import { authUrls } from "../apps/auth/urls.js";


export const urls = [
  ...authUrls,
  ...blogUrls
];