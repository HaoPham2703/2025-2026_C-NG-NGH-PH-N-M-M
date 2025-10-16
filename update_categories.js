const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'Data', 'fastfood.products.json');

// Read the products file
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Update all products with old food category to new standardized food category
products.forEach(product => {
  if (typeof product.category === 'string' && product.category.startsWith('64b7')) {
    product.category = '68e37238e38613b12df37659';
  }
});

// Write back the updated products
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));