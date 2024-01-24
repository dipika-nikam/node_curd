const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const userController = require('../controllers/userController')
const upload = require('../middleware/multer')
const verifyToken = require('../middleware/authMiddleware');

router.post('/user/register', userController.userRegister);
router.post('/user/login', userController.userLogin);
router.get('/get/products', productController.getAllProducts);
router.post('/user/send/email', userController.resetPassword )

router.use(verifyToken);

router.get('/get/products/:id', productController.getProductById);
router.put('/update/products/:id', upload.array('file', 2),productController.updateProduct);
router.put('/update/product/image/:id/:imageId',upload.single('file'), productController.findProductAndImage);
router.delete('/delete/products/:id', productController.deleteProduct);
router.post('/product',upload.array('file',2), productController.createProduct);
router.put('/user/update/', userController.updatedUser);
router.delete('/user/delete/', userController.deleteUser);
router.put('/user/change/password', userController.changePassword);
router.post('/user/forgot/password', userController.forgotpassword )

module.exports = router;