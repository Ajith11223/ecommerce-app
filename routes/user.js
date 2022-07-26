const { Router } = require('express');
const express = require('express');
const async = require('hbs/lib/async');
const twilio = require('twilio')
const { isNull, method, reject } = require('lodash');
const { Db } = require('mongodb');
const { resolve } = require('promise');
const { response } = require('../app');
const collections = require('../config/collections');
const productHelpers = require('../helpers/product-helpers');
const router = express.Router();
const userHelpers = require('../helpers/user-helpers')
const twilioHelpers = require('../helpers/twilio-helpers');
const { getProductTotalSingle } = require('../helpers/user-helpers');


let searchProducts;

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/login')
  }
}


// let glob=null

/* GET home page. */
router.get('/', async function (req, res, next) {
  try {
    let users = req.session.user
    let cartCount = null
    let wishListCount = null
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)
    }
    productHelpers.getAllProducts().then((products) => {
      userHelpers.getBannerProducts().then((banner) => {
        console.log(banner);
        res.render('user/user-index',
          {
            user: true, layout: 'user-layouts',
            users, products, cartCount, wishListCount, banner, home: true
          })
      })

    })
  } catch (err) {
    next(err)
  }

});


// sign up page
router.get('/signup', function (req, res, next) {
  try {
    res.header('cache-control',
      'private,no-cache,no-store,must-revalidate,max-stale=0,post-check=0');
    if (req.session.loggedIn) {
      res.redirect('/')
    } else {
      res.render('user/user-signup',
        { layout: 'user-layouts', signup: req.session.signup })
      req.session.logginErr = false

    }
  } catch (err) {
    next(err)
  }
});
// sign up post
router.post('/signup', (req, res, next) => {
  try {
    req.session.body = req.body


    userHelpers.checkUnique(req.body).then((response) => {
      if (response.count) {
        req.session.signup = "Already registered,please login"
        res.redirect('/signup')
      }
      twilioHelpers.doSms(req.session.body).then((data) => {
        if (data) {
          res.redirect('/otp')
        } else {
          redirect('/signup')
        }
      })

    })

  } catch (err) {
    next(err)
  }
});
// otp page rendering
router.get('/otp', (req, res) => {
  res.render('user/otp', { layout: 'user-layouts' })
})
// otp post requst
router.post('/otp', (req, res, next) => {
  try {
    twilioHelpers.otpVerify(req.body, req.session.body).then((response) => {

      if (response.valid) {
        userHelpers.doSignup(req.session.body).then((response) => {

          res.redirect('/login')
        })
      } else {

        res.redirect('/otp')
      }
    })
  } catch (err) {
    next(err)
  }
})


//login page rendering 
router.get('/login', (req, res, next) => {
  try {
    res.header('cache-control',
      'private,no-cache,no-store,must-revalidate,max-stale=0,post-check=0');
    if (req.session.loggedIn) {
      res.redirect('/')
    }
    res.render('user/user-login',
      { layout: 'user-layouts', logginErr: req.session.logginErr })
    req.session.logginErr = false
  } catch (err) {
    next(err)
  }
})

router.post('/login', (req, res, next) => {
  try {
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.loggedIn = true
        req.session.user = response.user
        res.redirect('/')
      }
      req.session.logginErr = "Invalid User and Password"
      res.redirect('/login')
    })
  } catch (err) {
    console.log(err);
    next(err)
  }
})
//logout
router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/login')
})
// shop all product list rendering page shop items 
router.get('/shop', async (req, res, next) => {
  try {
    let users = req.session.user
    let cartCount = null
    let wishListCount = null
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)

    }
    productHelpers.getAllProducts().then((products) => {
      //  let p = productHelpers.getSortProduct(glob).then((sortProduct)=>{
      //     console.log(sortProduct);
      //   })
      productHelpers.getFilterProduct(req.session.filter).then((product) => {
        productHelpers.getFilterPrice(req.session.priceFilter).then((priceF) => {
          if (searchProducts) {
            products = searchProducts
          }

          res.render('user/shop',
            { user: true, products, layout: 'user-layouts', users, cartCount, product, priceF, wishListCount, shop: true })
          searchProducts = null;
        })
      })

    })

  } catch (err) {
    next(err)
  }
})

//product-cart page renderin
router.get('/product-cart', verifyLogin, async (req, res, next) => {
  try {

    let users = req.session.user
    const userId = req.session.user._id
    let cartCount = null
    let wishListCount = null
    let total = 0
    let superateTotal = 0


    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)

    }
    let products = await userHelpers.getCartProduct(userId)
    superateTotal = await userHelpers.getProductTotalSingle(users._id)

    if (products.length > 0) {

      total = await userHelpers.getTotalAmount(users._id)
    }
    if (cartCount > 0) {

      res.render('user/product-cart',
        { user: true, layout: 'user-layouts', users, products, cartCount, total, wishListCount, superateTotal })



    } else {
      res.redirect('/empty')
    }

  } catch (err) {
    console.log(err);
    next(err)
  }
})
// cart actions 
router.get('/add-cart/:id', verifyLogin, (req, res, next) => {
  try {
    let userId = req.session.user
    userHelpers.addCart(req.params.id, userId._id).then(() => {
      res.json({ status: true })
    })
  } catch (err) {
    console.log(err);
    next(err)
  }
})

// product details rendering
router.get('/product-details/:id', async (req, res, next) => {
  try {
    let users = req.session.user
    let cartCount = null
    let wishListCount = null
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)
    }
    let product = await productHelpers.getProductDetails(req.params.id)
if(product){
  res.render('user/product-details',
  { user: true, layout: 'user-layouts', product, users, cartCount, wishListCount })
}else{
  res.redirect('/shop')
}
    
  } catch (err) {
    console.log(err);
    next(err)
  }
})

// change product quantity
router.post('/change-pproduct-quantity', verifyLogin, (req, res, next) => {

  try {
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmount(req.body.user)
      res.json(response)
    })
  } catch (err) {
    console.log(err);
    next(err)
  }
})
//checkout page rendering
router.get('/checkout', verifyLogin, async (req, res, next) => {
  try {
    let users = req.session.user
    let cartCount = null
    let wishListCount = null
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)

    }
    let total = await userHelpers.getTotalAmount(users._id)

    res.render('user/checkout',
      { user: true, layout: 'user-layouts', users, cartCount, total, wishListCount })
  } catch (err) {
    console.log(err);
    next(err)
  }
})



router.get('/filter/:v', async (req, res, next) => {
  try {
    console.log(req.params.v);
    req.session.filter = req.params.v
    res.json({ status: true })
  } catch (err) {
    next(err)
  }
})
//price filter
router.get('/price/:p', (req, res, next) => {
  try {
    console.log(req.params.p);
    req.session.priceFilter = req.params.p
    res.json({ status: true })
  } catch (err) {
    next(err)
  }
})
// // sorting
// router.get('/sort/:s',(req,res)=>{
//   console.log('hh'+req.params.s);
//   req.session.priceSort=req.params.s 
//   glob=req.params.s
//   res.json({status:true})


// })
//delete cart
router.post('/delete-cart', (req, res, next) => {
  try {
    userHelpers.deleteCartProduct(req.body, req.session.user._id).then((response) => {
      res.json(response)
    })
  } catch (err) {
    next(err)
  }
})

// wishlist rendering 
router.get('/user-wishlist', verifyLogin, async (req, res, next) => {
  try {
    let users = req.session.user
    let cartCount = null
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      const products = await userHelpers.getWishListProduct(users._id)
      /// wishlist count
      const wishListCount = await userHelpers.getWishListCount(users._id)
      req.session.wishListCount = wishListCount

      res.render('user/user-wishlist',
        { user: true, layout: 'user-layouts', users, cartCount, products, wishListCount })
    }
  } catch (err) {
    next(err)
  }
})
//wishlist get req
router.get('/add-wish-list/:wishList', (req, res, next) => {
  try {
    let users = req.session.user
    userHelpers.addWishList(req.params.wishList, users._id).then((response) => {
      if (response.logged) {
        res.json({ logged: true })
      } else {
        res.json({ logged: false })
      }
    })
  } catch (err) {
    next(err)
  }
})
/// delete wish list
router.post('/remove-wishlist', (req, res, next) => {
  try {
    userHelpers.deleteWishListProduct(req.body, req.session.user._id).then((response) => {
      res.json(response)
    })
  } catch (err) {
    next(err)
  }
})
// ordere placing form submission
router.post('/place-order', verifyLogin, async (req, res, next) => {
  try {
    let products = await userHelpers.getCartProductList(req.body.userId)
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
      if (req.body['payment-method'] === 'COD') {
        res.json({ codSuccess: true })
      } else {
        userHelpers.generateRazorPay(response, totalPrice).then((response) => {
          res.json(response)
        })
      }
    })
  } catch (err) {
    next(err)
  }
})
// order success msg page rendering
router.get('/user-order', verifyLogin, async (req, res, next) => {
  try {
    let users = req.session.user
    let cartCount = null
    let wishListCount = null

    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)
    }
    res.render('user/user-order',
      { user: true, layout: 'user-layouts', users, cartCount, wishListCount, order: true })
  } catch (err) {
    next(err)
  }
})
// user order liste rendering /// order product getting
router.get('/orders', verifyLogin, async (req, res, next) => {
  try {
    let users = req.session.user
    let cartCount = null
    let wishListCount = null
    let orderCount = null
    let product = await userHelpers.orderProduct(users._id)
    
  
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)
      orderCount = await userHelpers.getOrderCount(users._id)

    }
    let products = await userHelpers.getOrderTrack(users._id)

    if (orderCount > 0) {
      let orderId = product[0]._id
      let orderProducts = await userHelpers.getOrderProduct(orderId)
    
      res.render('user/orders',
        { user: true, layout: 'user-layouts', users, cartCount, wishListCount, orderProducts, product, products })
    } else {
      res.redirect('/emptyOrder')
    }

  } catch (err) {
    next(err)
  }
})
// order products display
router.get('/view-order-products/:id', verifyLogin, async (req, res, next) => {
  try {
    let users = req.session.user
    let cartCount = null
    let wishListCount = null

    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)
    }
    let products = await userHelpers.getOrderProduct(req.params.id)
    let notActive = products.notActive
    let product = await userHelpers.orderProduct(users._id)
    console.log(88899);
    console.log(products);

    res.render('user/view-order-products',
      { user: true, layout: 'user-layouts', users, cartCount, wishListCount, products, notActive, product })
  } catch (err) {
    next(err)
  }
})
//cancel order
router.get('/delete-order-products/:id', verifyLogin, (req, res, next) => {
  try {
    const users = req.session.user
    userHelpers.deleteOrder(users._id).then(() => {
      res.redirect('/orders')
    })
  } catch (err) {
    next(err)
  }
})
//
router.post('/verify-payment', verifyLogin, (req, res, next) => {
  try {
    userHelpers.verifyPayment(req.body).then(() => {
      userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {
        res.json({ status: true })

      })
    }).catch((err) => {
      res.json({ status: false, errMsg: 'payment failed' })
    })
  } catch (err) {
    next(err)
  }
})
// user adress and profile 
router.get('/user-profile', verifyLogin, async (req, res, next) => {
  try {
    let users = req.session.user
    let userId = users._Id

    let cartCount = null
    let wishListCount = null

    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)
    }
    userHelpers.getProfile(users._id).then((profile) => {
      res.render('user/user-profile',
        { user: true, layout: 'user-layouts', userId, profile, users, cartCount, wishListCount })
    })
  } catch (err) {
    next(err)
  }
})
// user profile adding page 
router.get('/user-addprofile', verifyLogin, async (req, res, next) => {
  try {
    let users = req.session.user
    let userId = users._id
    let cartCount = null
    let wishListCount = null

    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)
    }

    res.render('user/user-addprofile',
      { user: true, layout: 'user-layouts', userId, users, cartCount, wishListCount })
  } catch (err) {
    next(err)
  }
})
//add adress post request
router.post('/user-addprofile', verifyLogin, (req, res, next) => {
  try {
    userHelpers.addProfile(req.body, (id) => {
      let imagep = req.files.image
      imagep.mv('./public/profile-images/' + id + '.jpeg', (err, done) => {
        // if(!err){
        //   res.redirect('/user-addprofile')

        // }else{
        //   console.log(err);
        // }

      })
      res.redirect('/user-profile')
    })
  } catch (err) {
    next(err)
  }
})
// edit profile
router.get('/user-editprofile', verifyLogin, async (req, res, next) => {
  try {
    let users = req.session.user
    let userId = users._id

    let cartCount = null
    let wishListCount = null

    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(users._id)
      wishListCount = await userHelpers.getWishListCount(users._id)
    }


    userHelpers.getProfile(userId).then((profile) => {
      res.render('user/user-editprofile',
        { user: true, layout: 'user-layouts', profile, users, userId, wishListCount })

    })
  } catch (err) {
    next(err)
  }
})
// profile edit update
router.post('/user-editprofile/:profileId', verifyLogin, async (req, res, next) => {
  try {
    let profileId = req.params.profileId
    await userHelpers.editProfile(req.body, req.params.profileId).then(() => {
      res.redirect('/user-profile')
      if (req.files.image) {
        let imagep = req.files.image
        imagep.mv('./public/profile-images/' + profileId + '.jpeg')
      }
    })
  } catch (err) {
    next(err)
  }
})
// cancel order
router.post('/cancel-order', verifyLogin, (req, res, next) => {
  try {
    let orderId = req.body.orderId
    let productId = req.body.productId
    userHelpers.cancelOrder1(orderId, productId).then((responce) => {
      res.json({ status: true })

    })
  } catch (err) {
    next(err)
  }
})
// search
router.post('/search', async (req, res, next) => {
  try {
    searchProducts = await userHelpers.searchProduct(req.body.search)
   
    res.redirect('/shop')

  } catch (err) {
    next(err)

  }
})
// empty page rendering
router.get('/empty', async (req, res) => {
  let users = req.session.user
  const userId = req.session.user._id
  let cartCount = null
  let wishListCount = null

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(users._id)
    wishListCount = await userHelpers.getWishListCount(users._id)

  }
  res.render('user/empty', { user: true, layout: 'user-layouts', users, cartCount, wishListCount })
})
// empty order rendr
router.get('/emptyOrder', async (req, res) => {
  let users = req.session.user
  const userId = req.session.user._id
  let cartCount = null
  let wishListCount = null

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(users._id)
    wishListCount = await userHelpers.getWishListCount(users._id)
  }

  res.render('user/emptyOrder', { user: true, layout: 'user-layouts', users, cartCount, wishListCount })
})
// contact page render
router.get('/contact', verifyLogin, async (req, res) => {
  let users = req.session.user
  const userId = req.session.user._id
  let cartCount = null
  let wishListCount = null

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(users._id)
    wishListCount = await userHelpers.getWishListCount(users._id)
  }
  res.render('user/contact', { user: true, layout: 'user-layouts', cartCount, wishListCount, users })
})
// email check forgot 
router.get('/user-email', (req, res) => {
  res.render('user/user-email', { layout: 'user-layouts' })
})
//user mobile otp
router.get('/user-mobile', (req, res) => {
  userHelpers.mobileFind(req.session.email).then((number) => {
    res.render('user/user-mobile', { layout: 'user-layouts', number })

  })
})
// post data email
router.post('/user-email', (req, res) => {
  req.session.email = req.body
  userHelpers.checkAlready(req.body).then((response) => {
    if (response.count) {
      res.redirect('/user-mobile')

    } else {
      req.session.signup = 'Email not registerd'
      res.redirect('/signup')
    }

  })
})
// user-otp rendering
router.get('/user-otp', (req, res) => {
  res.render('user/user-otp', { layout: 'user-layouts' })
})

//user mobile post 
router.post('/user-mobile', (req, res) => {
  req.session.phone = req.body
  userHelpers.checkAlreadyMobile(req.body).then((response) => {
    if (response.count) {
      twilioHelpers.doSms(req.body).then((data) => {
        if (data) {
          res.redirect('/user-otp')
        } else {
          req.session.signup = 'number not match please signup'
          res.redirect('/signup')
        }
      })

    } else {
      req.session.signup = "Number not valid,please sign up"
      res.redirect('/signup')
    }

  })
})
//new password render
router.get('/rest-password', (req, res) => {
  res.render('user/rest-password', { layout: 'user-layouts' })
})
//post otp
router.post('/user-otp', (req, res, next) => {
  try {
    twilioHelpers.otpVerify(req.body, req.session.phone).then((response) => {

      if (response.valid) {
        res.redirect('/rest-password')

      } else {
        req.session.signup = 'not valid ,please signup'
        res.redirect('/signup')
      }
    })
  } catch (err) {
    next(err)
  }
})
//new password post
router.post('/rest-password', (req, res) => {
  userHelpers.doPasswordUpdate(req.body, req.session.email).then((response) => {
    res.redirect('/login')
  })
})
// user feedback
router.post('/feedback', (req, res) => {
  console.log(req.body);
  userHelpers.submitReview(req.body).then((response) => {

    res.redirect('/contact')
  })
})
// invoice 
router.get('/invoice/:id/:ik', verifyLogin, async (req, res) => {
  let orderId = req.params.id
  let proId = req.params.ik
  let users = req.session.user
  const userId = req.session.user._id
  let cartCount = null
  let wishListCount = null

  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(users._id)
    wishListCount = await userHelpers.getWishListCount(users._id)
  }
  userHelpers.getSingleInvoice(orderId, proId).then((alldata) => {
    res.render('user/invoice', { user: true, layout: 'user-layouts', users, cartCount, wishListCount, alldata })


  })


})



module.exports = router;
