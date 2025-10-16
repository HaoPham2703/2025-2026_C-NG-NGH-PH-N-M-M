const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, 'Data', 'fastfood.products.json');

// Read the products file
const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

// Update all products with laptop category to fast food category
products.forEach(product => {
  if (product.category === '64b7f2b8c9d1a3e5f0a1b2eLaptop') {
    product.category = '68e37238e38613b12df37659';
  }
});

// Write back the updated products
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));