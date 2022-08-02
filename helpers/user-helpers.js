const db = require('../config/connection')
const collections = require('../config/collections')
const bcrypt = require('bcrypt');
const { reject, resolve } = require('promise');
const { result, truncate, toLower, method, sum } = require('lodash');
const async = require('hbs/lib/async');
const path = require('../app');
const { ObjectId } = require('mongodb');
const { response } = require('../app');
const Razorpay = require('razorpay');
const { profile } = require('console');
require('dotenv').config()

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});



module.exports = {
    doSignup: (userData) => {

        return new Promise(async (resolve, reject) => {
            userData.blockUser = false
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collections.USER_COLLECTION).
                insertOne(userData).then((data) => {
                    resolve(data.insertedId);
                });

        });
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            // data edukunnu db yil ninn
            try {
                let loginStatus = false
                let response = {}
                let convert = userData.Email.toLowerCase()
                userData.Email = convert
                let user = await db.get().collection(collections.USER_COLLECTION).
                    findOne({ email: userData.Email, blockUser: false })
                if (user) {
                    bcrypt.compare(userData.password, user.password).then((status) => {
                        if (status) {
                            console.log("login success");
                            response.user = user
                            response.status = true
                            response.userEmail = status
                            resolve(response)
                        } else {
                            console.log("login failed");
                            resolve({ status: false })
                        }

                    })
                } else {
                    console.log("user failed");
                    resolve({ status: false })
                }
            } catch (err) {
                reject(err)
            }
        })
    },
    // unique sign up user
    checkUnique: (userData) => {

        let valid = {}
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collections.USER_COLLECTION).
                    findOne({ email: userData.email })
                if (count) {
                    valid.count = true
                    resolve(valid)
                } else {
                    resolve(valid)
                }
            } catch (error) {
                reject(error)
            }
        })

    },
    //cart
    addCart: (productId, userId) => {
        let productObj = {
            item: ObjectId(productId),
            quantity: 1,
            status: 'pending',
            notActive: false
        }
        return new Promise(async (resolve, reject) => {
            try {
                let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId(userId) })
                if (userCart) {
                    let productExist = userCart.products.findIndex(products => products.item == productId)
                    if (productExist != -1) {
                        db.get().collection(collections.CART_COLLECTION)
                            .updateOne({ user: ObjectId(userId), 'products.item': ObjectId(productId) },
                                {
                                    $inc: { 'products.$.quantity': 1 }
                                }
                            ).then(() => {
                                resolve()
                            })
                    } else {
                        db.get().collection(collections.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                            {

                                $push: { products: productObj }

                            }).then((response) => {
                                resolve(response)
                            })
                    }
                } else {
                    let cartObj = {
                        user: ObjectId(userId),
                        products: [productObj]
                    }
                    db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((response) => {
                        resolve(response)
                    })
                }
            } catch (err) {
                reject(err)
            }
        })
    },
    // get cart products
    getCartProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                    {
                        $match: { user: ObjectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'products'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                        }
                    }

                ]).toArray()

                resolve(cartItems)
            } catch (error) {
                reject(error)
            }

        })
    },
    //product count
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = 0
                let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId(userId) })
                if (cart) {
                    count = cart.products.length
                }
                resolve(count)
            } catch (err) {
                reject(err)
            }
        })
    },
    // change product quantity
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve, reject) => {
            try {
                if (details.count == -1 && details.quantity == 1) {
                    db.get().collection(collections.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) },
                        {
                            $pull: { products: { item: ObjectId(details.product) } }
                        }
                    ).then((response) => {
                        resolve({ removeProduct: true })
                    })
                } else {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne({ _id: ObjectId(details.cart), 'products.item': ObjectId(details.product) },
                            {
                                $inc: { 'products.$.quantity': details.count }
                            }
                        ).then((response) => {
                            resolve({ status: true })
                        })
                }
            } catch (err) {
                reject(err)
            }

        })

    },
    // single product total amount
    getProductTotalSingle: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let sumt = await db.get().collection(collections.CART_COLLECTION).aggregate([
                    {
                        $match: { user: ObjectId(userId) }
                    },


                    {
                        '$unwind': {
                            'path': '$products'
                        }
                    }, {
                        '$lookup': {
                            'from': 'product',
                            'localField': 'products.item',
                            'foreignField': '_id',
                            'as': 'lookupProducts'
                        }
                    }, {
                        '$unwind': {
                            'path': '$lookupProducts'
                        }
                    },

                    {
                        $project: {
                            _id: 0,
                            sum: { $sum: { $multiply: ['$products.quantity', '$lookupProducts.price'] } }
                        }
                    }

                ]).toArray()

                resolve(sumt)

            } catch (err) {
                reject(err)
            }
        })
    },
    // total amount
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
                    {
                        $match: { user: ObjectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'products'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, products: { $arrayElemAt: ['$products', 0] }
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', '$products.price'] } }
                        }
                    }

                ]).toArray()
                if (total[0]) {
                    resolve(total[0].total)
                } else {
                    resolve()
                }

            } catch (err) {
                reject(err)
            }
        })
    },
    // delete cart product
    deleteCartProduct: (details, userId) => {
        return new Promise((resolve, reject) => {

            try {
                db.get().collection(collections.CART_COLLECTION).updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removedProduct: true })
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    //wishlist add
    addWishList: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let wishListObj = {
                    item: ObjectId(productId)
                }
                let userWish = await db.get().collection(collections.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
                if (userWish) {
                    let productExist = userWish.products.findIndex((products) => products.item == productId)
                    if (productExist != -1) {
                        resolve({ logged: false })
                        db.get().collection(collections.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) },
                            {
                                $pull: { products: wishListObj }
                            }
                        )

                    } else {
                        db.get().collection(collections.WISHLIST_COLLECTION).updateOne({ user: ObjectId(userId) },
                            {

                                $push: { products: wishListObj }

                            }).then((response) => {
                                resolve({ logged: true })
                            })
                    }
                } else {
                    let wishList = {
                        user: ObjectId(userId),
                        products: [wishListObj]
                    }
                    db.get().collection(collections.WISHLIST_COLLECTION).insertOne(wishList).then((response) => {
                        resolve(response)
                        console.log('suceees');
                    })
                }
            } catch (err) {
                reject(err)
            }
        })
    },
    // get wish list product
    getWishListProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let wishListItems = await db.get().collection(collections.WISHLIST_COLLECTION).aggregate([
                    {
                        $match: { user: ObjectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item'

                        }
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'products'
                        }
                    },
                    {
                        $project: {
                            item: 1, products: { $arrayElemAt: ['$products', 0] }
                        }
                    }

                ]).toArray()

                resolve(wishListItems)
            } catch (err) {
                reject(err)
            }

        })

    },
    ///wish list count
    getWishListCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = 0
                const wishList = await db.get().collection(collections.WISHLIST_COLLECTION).findOne({ user: ObjectId(userId) })
                if (wishList) {
                    count = wishList.products.length
                }
                resolve(count)
            } catch (err) {
                reject(err)
            }
        })

    },
    ///  delete wish  list products
    deleteWishListProduct: (details, userId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.WISHLIST_COLLECTION).updateOne({ _id: ObjectId(details.cart) },
                    {
                        $pull: { products: { item: ObjectId(details.product) } }
                    }
                ).then((response) => {
                    resolve({ removedWishList: true })
                })
            } catch (err) {
                reject(err)
            }
        })


    },
    // place order
    placeOrder: (order, products, totalPrice) => {
        return new Promise((resolve, reject) => {
            let orderStatus = order['payment-method'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryAdress: {
                    name: order.name,
                    mobile: order.mobile,
                    adress: order.adress,
                    totalAmount: totalPrice,
                    pincode: order.pincode,
                    country: order.country,
                    city: order.city,
                    state: order.state,
                    pincode: order.pincode,
                    date: Date()
                },
                userId: ObjectId(order.userId),
                paymentMethod: order['payment-method'],
                pending: true,
                placed: false,
                shipped: false,
                deliverd: false,
                status: orderStatus,
                deliveryStatus: 'pending',
                products: products


            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collections.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
                for (i = 0; i < products.length; i++) {
                    db.get().collection(collections.PRODUCT_COLLECTION).updateOne({ _id: ObjectId(products[i].item) }, {
                        $inc: { stock: -products[i].quantity }
                    })
                }
                resolve(response.insertedId)
            })


        })

    },
    // get cart product
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: ObjectId(userId) })
                resolve(cart.products)
            } catch (err) {
                reject(err)
            }
        })

    },
    // order product getting 
    orderProduct: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray()
                resolve(products)
            } catch (err) {
                reject(err)
            }

        })
    },
    // get orderd products
    getOrderProduct: (orderId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    {
                        $match: { _id: ObjectId(orderId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity',
                            status: '$products.status',
                            notActive: '$products.notActive'


                        }
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'products'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, status: 1, notActive: 1, products: { $arrayElemAt: ['$products', 0] }
                        }
                    }

                ]).toArray()

                resolve(orderItems)
            } catch (err) {
                reject(err)
            }

        })

    },
    // cancel order
    deleteOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ORDER_COLLECTION).deleteOne({ userId: ObjectId(orderId) }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // razorpay
    generateRazorPay: (orderId, total) => {

        return new Promise((resolve, reject) => {
            try {
                const options = {
                    amount: +total * 100,
                    currency: "INR",
                    receipt: "" + orderId
                };
                instance.orders.create(options, function (err, order) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('order');
                        resolve(order)
                    }

                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // verify payment
    verifyPayment: (orderDetails) => {
        return new Promise((resolve, reject) => {
            try {
                const crypto = require('crypto');
                let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                hmac.update(orderDetails['payment[razorpay_order_id]'] + '|' + orderDetails['payment[razorpay_payment_id]']);
                hmac = hmac.digest('hex')
                console.log(hmac);
                if (hmac == orderDetails['payment[razorpay_signature]']) {
                    resolve()
                } else {
                    reject()
                }
            } catch (err) {
                reject(err)
            }
        })

    },
    // payment status change
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) },
                    {
                        $set: {
                            status: 'placed'
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
    // user profile adding
    addProfile: (profile, callback) => {
        db.get().collection(collections.PROFILE_COLLECTION).insertOne(profile).then((datap) => {
            callback(datap.insertedId)
        })
    },
    // get profile
    getProfile: (userId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.PROFILE_COLLECTION).findOne({ userId: userId }).then((profile) => {
                    console.log(profile);
                    resolve(profile)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // profile editing
    editProfile: (proDetails, profileId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.PROFILE_COLLECTION).updateOne({ _id: ObjectId(profileId) },
                    {
                        $set: {
                            name: proDetails.name,
                            lastname: proDetails.lastname,
                            adress: proDetails.adress,
                            state: proDetails.state,
                            mobile: proDetails.mobile,
                            email: proDetails.email
                        }
                    }
                ).then((response) => {
                    resolve(response)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    //cancel order clint
    cancelOrder1: (orderId, productId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId), 'products.item': ObjectId(productId) },
                    {
                        $set: {
                            "products.$.status": 'cancel',
                            "products.$.notActive": true

                        }
                    }).then((response) => {
                        resolve(response)
                    })
            } catch (err) {
                reject(err)
            }
        })
    },
    // get banner products 
    getBannerProducts: () => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.BANNER_COLLECTION).find({ status: true }).toArray().then((banner) => {
                    resolve(banner)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // search
    searchProduct: (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({
                    '$or': [
                        { name: { $regex: data, $options: 'i' } },
                        { subCategory: { $regex: data, $options: 'i' } }

                    ]
                }).toArray()
                resolve(products)

            } catch (err) {
                reject(err)

            }
        })
    },
    // order count
    getOrderCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).count()

                resolve(count)
            } catch (err) {
                reject(err)
            }
        })

    },
    //check unique
    checkAlready: (userData) => {

        let valid = {}
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collections.USER_COLLECTION).
                    findOne({ email: userData.email })
                if (count) {
                    valid.count = true
                    resolve(valid)
                } else {
                    resolve(valid)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    //number check unique
    checkAlreadyMobile: (userData) => {

        let valid = {}
        return new Promise(async (resolve, reject) => {
            try {
                let count = await db.get().collection(collections.USER_COLLECTION).
                    findOne({ phone: userData.phone })
                if (count) {
                    valid.count = true
                    resolve(valid)
                } else {
                    resolve(valid)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    //password update
    doPasswordUpdate: (pass, userMail) => {

        return new Promise(async (resolve, reject) => {
            pass.password = await bcrypt.hash(pass.password, 10)
            db.get().collection(collections.USER_COLLECTION).updateOne({ email: userMail.email },
                {
                    $set: {
                        password: pass.password
                    }
                }
            ).then((response) => {
                resolve(response)
            })
        })
    },
    //find mobile number
    mobileFind: (data) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).findOne({ email: data.email }).then((number) => {
                resolve(number)
            })
        })
    },
    // feedback insert
    submitReview: (data) => {
        return new Promise((resolve, reject) => {
            data.date = Date()
            db.get().collection(collections.REVIEW_COLLECTION).insertOne(data).then((response) => {
                resolve(response)
            })
        })
    },
    //invoice
    getSingleInvoice: (orderId, proId) => {
        return new Promise(async (resolve, reject) => {
            let data = await db.get().collection(collections.ORDER_COLLECTION).aggregate(

                [
                    {
                        '$match': {
                            '_id': new ObjectId(orderId)
                        }
                    }, {
                        '$unwind': {
                            'path': '$products'
                        }
                    }, {
                        '$match': {
                            'products.item': new ObjectId(proId)
                        }
                    }, {
                        '$lookup': {
                            'from': 'product',
                            'localField': 'products.item',
                            'foreignField': '_id',
                            'as': 'lookProduct'
                        }
                    }, {
                        '$unwind': {
                            'path': '$lookProduct'
                        }
                    }, {
                        '$project': {
                            'deliveryAdress': 1,
                            'userId': 1,
                            'deliverd': 1,
                            'paymentMethod': 1,
                            'lookProduct': 1,
                            'products': 1,
                            'total': {
                                $multiply: ["$products.quantity", "$lookProduct.price"],
                            }
                        }
                    }
                ]
            ).toArray()

            resolve(data)
        })
    },
    //ordertrack
    getOrderTrack: (userId) => {
        return new Promise(async (resolve, reject) => {
            const data = await db.get().collection(collections.ORDER_COLLECTION).aggregate(
                [
                    {
                        '$match': {
                            'userId': new ObjectId(userId)
                        }
                    }, {
                        '$unwind': {
                            'path': '$products'
                        }
                    }, {
                        '$lookup': {
                            'from': 'product',
                            'localField': 'products.item',
                            'foreignField': '_id',
                            'as': 'lookupProducts'
                        }
                    }, {
                        '$unwind': {
                            'path': '$lookupProducts'
                        }
                    }
                ]
            ).toArray()
            resolve(data)
        })
    }

}
