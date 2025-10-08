// permissionsConfig.js (ESM)

import { loadModels } from "./loader.js";

// Generate standard perms
const loadedModels = await loadModels(); // auto-load all models from /models folder
const models = loadedModels.map(m => m.table);
// console.log(models);
// console.log("permison models",models)

function generateModelPermissions(model) {
  return [
    `add_${model}`,
    `change_${model}`,
    `delete_${model}`,
    `view_${model}`
  ];
}

export const defaultPermissions = models.flatMap(generateModelPermissions);

export const customPermissions = [
  'publish_product',
  'archive_category',
  'add_product_review',
  'edit_own_product_review',
  'delete_own_product_review',
  'moderate_product_review'
];

// role -> default perms
export const rolePermissions = {
  admin: [...defaultPermissions, ...customPermissions],
  editor: [
    ...generateModelPermissions('blog'),
    ...generateModelPermissions('product')
  ],
  user: [
    'view_products',
    'view_posts'
  ],
  customer: [
    'view_product',
    'view_blog',
    'add_product_review',
    'edit_own_product_review',
    'delete_own_product_review'
  ]
};

// Export a full allowed set helper (optional)
export const allPermissions = [...new Set([...defaultPermissions, ...customPermissions])];
