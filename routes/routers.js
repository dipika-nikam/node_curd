const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const upload = require('../middleware/multer')

router.get('/get/products', productController.getAllProducts);
router.get('/get/products/:id', productController.getProductById);
router.put('/update/products/:id', upload.array('file', 2),productController.updateProduct);
router.put('/update/product/image/:id/:imageId',upload.single('file'), productController.findProductAndImage);
router.delete('/delete/products/:id', productController.deleteProduct);
router.post('/product',upload.array('file',2), productController.createProduct);

module.exports = router;