// core/urls.js

import { blogUrls } from "../blog/urls.js";
import { authUrls } from "../auth/urls.js";


export const urls = [
  ...authUrls,
  ...blogUrls
];