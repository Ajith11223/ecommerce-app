const db = require('../config/connection')
const collections = require('../config/collections')
const bcrypt = require('bcrypt');
const async = require('hbs/lib/async');
const { resolve, reject } = require('promise');
const { ObjectId } = require('mongodb');
const { response } = require('express');

module.exports = {
    adminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                let admin = await db.get().collection(collections.ADMIN_COLLECTION).findOne({ email: adminData.email })
                if (admin) {
                    bcrypt.compare(adminData.password, admin.password).then((adminStatus) => {
                        if (adminStatus) {
                            console.log("admin login success");
                            response.admin = admin
                            response.adminStatus = true
                            resolve(response)
                        } else {
                            console.log("admin login failed");
                            resolve({ adminStatus: false })
                        }

                    })
                } else {
                    console.log("admin user failed");
                    resolve({ adminStatus: false })
                }
            } catch (err) {
                reject(err)
            }

        })

    },

    //user list get
    getAllUser: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let user = await db.get().collection(collections.USER_COLLECTION).find().toArray()
                resolve(user)
            } catch (err) {
                reject(err)
            }
        })
    },
    //block user
    blockUser: (userId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                    $set: {
                        blockUser: true
                    }
                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })

    },
    //unblock user
    unblockUser: (userId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.USER_COLLECTION).updateOne({ _id: ObjectId(userId) }, {
                    $set: {
                        blockUser: false
                    }
                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },

    // add category 
    addCategory1: (categoryData) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.ADDCATEGORY_COLLECTION).insertOne(categoryData).then((response) => {
                resolve(response)
            })
        })

    },
    // get all category 
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const addCategory = await db.get().collection(collections.ADDCATEGORY_COLLECTION).find().toArray()
                resolve(addCategory)
            } catch (err) {
                reject(err)
            }
        })
    },
    // add sub actegory
    addSubCategory: (subData) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.SUBCATEGORY_COLLECTION).insertOne(subData).then((response) => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // get all sub category
    getAllSubcategory: () => {
        return new Promise(async (resolve, reject) => {
            const subcategory = await db.get().collection(collections.SUBCATEGORY_COLLECTION).find().toArray()
            resolve(subcategory)
        })
    },
    // find single category
    getCategory: (catId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ADDCATEGORY_COLLECTION).findOne({ _id: ObjectId(catId) }).then((ecategory) => {
                    resolve(ecategory)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // edit category add
    addCategory: (cateData, cateId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ADDCATEGORY_COLLECTION).updateOne({ _id: ObjectId(cateId) },
                    {
                        $set: {
                            name: cateData.name
                        }
                    }
                ).then((responce) => {
                    resolve(responce)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // delete category
    deleteCategoryAdd: (cateId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ADDCATEGORY_COLLECTION).deleteOne({ _id: ObjectId(cateId) }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // find one subcategory
    getSubCategoryOne: (SubId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.SUBCATEGORY_COLLECTION).findOne({ _id: ObjectId(SubId) }).then((subcategory) => {
                    resolve(subcategory)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // edit sub category add
    updateSubCategory: (subCateData, subCateId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.SUBCATEGORY_COLLECTION).updateOne({ _id: ObjectId(subCateId) },
                    {
                        $set: {
                            name: subCateData.name
                        }
                    }
                ).then((responce) => {
                    resolve(responce)
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // delete sub category
    deleteSubCategory: (subCAtId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.SUBCATEGORY_COLLECTION).deleteOne({ _id: ObjectId(subCAtId) }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // gett banner products
    getBanner: (proId) => {
        return new Promise(async (resolve, reject) => {
            try {
                await db.get().collection(collections.BANNER_COLLECTION).findOne({ _id: ObjectId(proId) }).then((products) => {
                    resolve(products)

                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // edit banner 
    editBanner: (data, proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.BANNER_COLLECTION).updateOne({ _id: ObjectId(proId) },
                    {
                        $set: {
                            name: data.name,
                            status: data.status
                        }
                    }).then((response) => {
                        resolve(response)
                    })
            } catch (err) {
                reject(err)
            }
        })
    },
    // delete banner
    deleteBanner: (proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.BANNER_COLLECTION).deleteOne({ _id: ObjectId(proId) }).then((response) => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // banner enble
    enableBanner: (proId, data) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.BANNER_COLLECTION).updateOne({ _id: ObjectId(proId) },
                    {
                        $set: {
                            status: data
                        }
                    }).then((response) => {
                        resolve(response)
                    })
            } catch (err) {
                reject(err)
            }
        })
    },
    // count getting
    onlinePaymentCount: () => {
        return new Promise((resolve, reject) => {
            let count = db.get().collection(collections.ORDER_COLLECTION).find({ paymentMethod: 'online', deliveryStatus: 'deliverd' }).count()
            resolve(count)

        })
    },
    // total users count finding
    totalUsers: () => {
        return new Promise((resolve, reject) => {
            let userCount = db.get().collection(collections.USER_COLLECTION).count()
            resolve(userCount)
        })
    },
    // total orders
    totalOrder: () => {
        return new Promise((resolve, reject) => {
            let totalOrder = db.get().collection(collections.ORDER_COLLECTION).find().count()
            resolve(totalOrder)
        })
    },
    // total cancel order
    cancelOrder: () => {
        return new Promise((resolve, reject) => {
            let totalCancel = db.get().collection(collections.ORDER_COLLECTION).find({ deliveryStatus: 'cancel' }).count()
            resolve(totalCancel)
        })
    },
    // total cod count
    totalCod: () => {
        return new Promise((resolve, reject) => {
            let totalCod = db.get().collection(collections.ORDER_COLLECTION).find({ paymentMethod: 'COD', deliveryStatus: 'deliverd' }).count()
            resolve(totalCod)
        })
    },
    //total placed 
    totalDeliveryStatus: (data) => {
        return new Promise((resolve, reject) => {
            let deliveryStatus = db.get().collection(collections.ORDER_COLLECTION).find({ deliveryStatus: data }).count()
            resolve(deliveryStatus)
        })
    },
    // total amount
    totalCost: () => {
        return new Promise((resolve, reject) => {
            let total = db.get().collection(collections.ORDER_COLLECTION).aggregate(
                [
                    {
                        '$project': {
                            'deliveryAdress.totalAmount': 1
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            'sum': { $sum: '$deliveryAdress.totalAmount' }
                        }
                    }
                ]).toArray()

            resolve(total)

        })
    },
    changeTrack: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                    $set: {
                        pending: false,
                        placed: false,
                        shipped: false,
                        deliverd: true,
                    }
                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    changeTrack1: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                    $set: {
                        pending: false,
                        placed: false,
                        shipped: true,
                        deliverd: false,
                    }
                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    changeTrack2: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                    $set: {
                        pending: true,
                        placed: false,
                        shipped: false,
                        deliverd: false,
                    }
                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    changeTrack3: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                    $set: {
                        pending: false,
                        placed: true,
                        shipped: false,
                        deliverd: false,
                    }
                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    changeTrack4: (orderId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collections.ORDER_COLLECTION).updateOne({ _id: ObjectId(orderId) }, {
                    $set: {
                        pending: false,
                        placed: false,
                        shipped: false,
                        deliverd: false,
                    }
                }).then(() => {
                    resolve()
                })
            } catch (err) {
                reject(err)
            }
        })
    },
    // get all review date wise
    allFeedback: () => {
        return new Promise(async (resolve, reject) => {
            let review = await db.get().collection(collections.REVIEW_COLLECTION).find().sort({ date: -1 }).toArray()
            resolve(review)

        })
    }

}