const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/get/products', productController.getAllProducts);
router.get('/get/products/:id', productController.getProductById);
router.put('/update/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.post('/product', productController.createProduct);

module.exports = router;