// permissionsConfig.js (ESM)
const models = ['product', 'category', 'blog', 'user'];

// Generate standard perms
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
    'view_product',
    'view_blog'
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
