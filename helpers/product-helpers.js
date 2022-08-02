const async = require('hbs/lib/async');
const { Collection } = require('mongodb');
const collections = require('../config/collections');
const db = require('../config/connection')
const Promise = require('promise');
const { resolve } = require('promise');
const { reject } = require('lodash');
const { response } = require('../app');
let objectId = require('mongodb').ObjectId


module.exports = {
    //product
    addProduct: (product, callback) => {
        console.log(product);
        product.price = parseInt(product.price)
        product.stock = parseInt(product.stock)
        const products = product
        db.get().collection('product').insertOne(products).then((data) => {
            callback(data.insertedId)

        })

    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
                resolve(products)
            } catch (err) {
                reject(err)
            }
        })
    },
    //add categories
    addCategory: (category, callback) => {
        db.get().collection('category').insertOne(category).then((datac) => {
            callback(datac.insertedId)
        })
    },
    //get all category

    //edit product details 
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((product) => {
                    resolve(product)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    //product updating
    editProduct: (productDetails, productId) => {
        productDetails.price = parseInt(productDetails.price)
        productDetails.stock = parseInt(productDetails.stock)

        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: objectId(productId) }, {
                    $set: {
                        name: productDetails.name,
                        category: productDetails.category,
                        subCategory: productDetails.subCategory,
                        price: productDetails.price,
                        description: productDetails.description,
                        stock: productDetails.stock

                    }
                }).then((response) => {
                    resolve(response)
                })
            } catch (err) {
                reject(err)
            }
        })

    },

    // delete product
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id: objectId(productId) }).then((response) => {
                    resolve(response)
                })
            } catch (err) {
                reject(err)
            }
        })

    },
    //delete category
    deleteCategory: (categoryId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.CATEGORY_COLLECTION).deleteOne({ _id: objectId(categoryId) }).then((response) => {
                    resolve(response)
                })
            } catch (err) {
                reject(err)
            }
        })
    },


    //edit category details 
    getCategoryDetails: (categoryId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) }).then((category) => {
                    resolve(category)
                })
            } catch (err) {
                reject(err)
            }
        })
    },


    //filter
    getFilterProduct: (filter) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.PRODUCT_COLLECTION).find({ "category": filter }).toArray().then((product) => {
                    console.log(product);
                    resolve(product)
                })
            } catch (err) {
                reject(err)
            }
        })

    },
    // price filter
    getFilterPrice: (priceFilter) => {
        priceFilter = parseInt(priceFilter)
        return new Promise((resolve, reject) => {
            console.log(priceFilter)
            db.get().collection(collections.PRODUCT_COLLECTION).find({ "price": { $lte: priceFilter } }).toArray().then((priceF) => {
                console.log(priceF);
                resolve(priceF)
            })
        })
    },
    // // sort
    // getSortProduct:(data)=>{
    //     console.log(data);
    //      data= parseInt(data)
    //     return new Promise(async(resolve,reject)=>{
    //         let sortProduct=await db.get().collection(collections.PRODUCT_COLLECTION).aggregate(
    //         [
    //             {
    //                 $sort:{price:data}

    //             }
    //         ]
    //         ).toArray()
    //         resolve(sortProduct)

    //     })
    // },
    //order products getting admin
    getOrderDetails: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let orderProduct = await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
                resolve(orderProduct)
            } catch (err) {
                reject(err)
            }
        })
    },

    changeDeliveryStatus: (orderId, status, field) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },

                    {
                        $set: {

                            deliveryStatus: status,
                            status: status,


                        }
                    }
                ).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // banner post req adding
    addBanner: (bannerData) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.BANNER_COLLECTION).insertOne(bannerData).then((data) => {
                    resolve(data.insertedId)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // get bannerb products 
    getBanner: () => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.BANNER_COLLECTION).find().toArray().then((banner) => {
                    resolve(banner)
                })
            } catch (err) {
                reject(err)
            }
        })
    }


}