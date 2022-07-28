const express = require('express');
const { response } = require('../app');
const adminHelpers = require('../helpers/admin-helpers');
const userHelpers = require('../helpers/user-helpers');
const producthelpers=require('../helpers/product-helpers')
const router = express.Router();
const session=require('express-session');
const { Router } = require('express');
const { getAllUser } = require('../helpers/admin-helpers');
const { PRODUCT_COLLECTION } = require('../config/collections');
const { result, reject } = require('lodash');
const async = require('hbs/lib/async');
const { resolve } = require('promise');
const { addCategory } = require('../helpers/product-helpers');



const verifyLogin = (req, res, next) => {
  if (req.session.logged) {
    next()
  } else {
    res.redirect('/admin/login')
  }
}


/* GET users listing. */
router.get('/',verifyLogin, async function(req, res,next) {
  try{
  if(req.session.logged){
    let delivery={}
    delivery.placed='placed'
    delivery.shipped='shipped'
    delivery.deliverd='deliverd'
    delivery.cancel='cancel'
  let admins=req.session.admin
  const allData=await Promise.all
  ([
    adminHelpers.onlinePaymentCount(),
    adminHelpers.totalUsers(),
    adminHelpers.totalOrder(),
    adminHelpers.cancelOrder(),
    adminHelpers.totalCod(),
    adminHelpers.totalDeliveryStatus(delivery.placed),
    adminHelpers.totalDeliveryStatus(delivery.shipped),
    adminHelpers.totalDeliveryStatus(delivery.deliverd),
    adminHelpers.totalDeliveryStatus(delivery.cancel),
    adminHelpers.totalCost(),
  ]) ;  
    res.render('admin/admin-dashboard',
    {admin:true,dashBoard:true,layout:'admin-layouts',
    admins,count:allData[0],
    totalUser:allData[1],
    totalOrder:allData[2],
    cancelOrder:allData[3],
    totalCod:allData[4],
    placed:allData[5],
    shipped:allData[6],
    deliverd:allData[7],
    cancel:allData[8],
    totalCost:allData[9],
  })
}else{
  res.redirect('/admin/login') 
}
  }catch(err){
    next(err)
  }
});
// admin login rendering
router.get('/login',(req,res,next)=>{
  try{
  res.header('cache-control', 
  'private,no-cache,no-store,must-revalidate,max-stale=0,post-check=0');

  if(req.session.logged){
    res.redirect('/admin')
}
  res.render('admin/admin-login',
  {layout:'admin-layouts',loginError:req.session.loginError})
  req.session.loginError=false;
}catch(err){
  console.log(err);
  next(err)
}
});
//
router.post('/login',(req,res,next)=>{
  try{
  adminHelpers.adminLogin(req.body).then((response)=>{
    if(response.adminStatus){
      req.session.logged=true
      req.session.admin=response.admin
      res.redirect('/admin')
    }
      req.session.loginError="Invalid Admin"
      res.redirect('/admin/login')
       })
      }catch(err){
        console.log();
        next(err)
      }
})
//
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/admin/login')
})
//user list rendering
router.get('/user',verifyLogin,(req,res,next)=>{
  try{
  if(req.session.logged){
     adminHelpers.getAllUser().then((user)=>{
      res.render('admin/user',
      {admin:true,layout:'admin-layouts',user,users:true})
          })
  }else{
    res.redirect('/admin/login')
  }
}catch(err){
  console.log(err);
  next(err)
}
})

//block user
router.get('/user/block_user/:id',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.blockUser(req.params.id).then(()=>{
    res.redirect('/admin/user')
  })
}catch(err){
  console.log(err);
  next(err)
}
})
//unblock user 
router.get('/user/unblock_user/:id',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.unblockUser(req.params.id).then(()=>{
    res.redirect('/admin/user')
  })
}catch(err){
  console.log(err);
  next(err)
}
})
//products
router.get('/products',verifyLogin,(req,res,next)=>{
  try{
  producthelpers.getAllProducts().then((products)=>{
    res.render('admin/products',
    {admin:true,layout:'admin-layouts',products,product:true})

  })
}catch(err){
  console.log(err);
  next(err)
}
})
//add product rendering
router.get('/add-products',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.getAllCategory().then((addCategory)=>{
    adminHelpers.getAllSubcategory().then((subcategory)=>{
      res.render('admin/add-products',
      {admin:true,layout:'admin-layouts',addCategory,subcategory})
    })
   
  })
}catch(err){
  next(err)
}
})

router.post('/add-products',verifyLogin,(req,res)=>{
  try{
  producthelpers.addProduct(req.body,(id)=>{
    let image=req.files.image
    image.mv('./public/product-images/'+id+'.jpeg',(err,done)=>{
      // if(!err){
      //   res.redirect('/admin/add-products')
      
      // }else{
      //   console.log(err);
      // }

    })
    res.redirect('/admin/products')
    })
  }catch(err){
    console.log(err);
  }
})



// add category rendering
router.get('/add-category',verifyLogin,(req,res)=>{
  try{
  res.render('admin/add-category',
  {admin:true,layout:'admin-layouts',category:true})
  }catch(err){
    console.log(err);
  }
})






// edit-product rendering
router.get('/edit-product/:id',verifyLogin,async(req,res,next)=>{
  try{
  let product=await producthelpers.getProductDetails(req.params.id)
  // adminHelpers.getAllCategory().then((addCategory)=>{
  //   adminHelpers.getAllSubcategory().then((subcategory)
  const category=await adminHelpers.getAllCategory()
  const subCategory=await adminHelpers.getAllSubcategory()
  res.render('admin/edit-product',
  {admin:true,layout:'admin-layouts',product,category,subCategory})
}catch(err){
  console.log(err);
  next(err)
}
})

//editing post req
router.post('/edit-product/:id',verifyLogin,(req,res,next)=>{
   let id=req.params.id
  try{
  producthelpers.editProduct(req.body,req.params.id).then(()=>{
    res.redirect('/admin/products')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-images/'+id+'.jpeg')
    }
  }) 
}catch(err){
  console.log(err);
  next(err)
}
})
//edit category rendering
router.get('/edit-category/:id',verifyLogin,async(req,res,next)=>{
  try{
 let categories=await producthelpers.getCategoryDetails(req.params.id)
 console.log(categories);
  res.render('admin/edit-category',{admin:true,layout:'admin-layouts',categories})
  }catch(err){
    console.log(err);
    next(err)
  }
})

//delete product
router.get('/delete-product/:id',verifyLogin,(req,res,next)=>{
  try{
  let productId=req.params.id
  console.log(productId);
  producthelpers.deleteProduct(productId).then((responce)=>{
    res.redirect('/admin/products')
  })
}catch(err){
  console.log(err);
  next(err)
}
})


//m order status
router.get('/order-status',verifyLogin,(req,res,next)=>{
try{
producthelpers.getOrderDetails().then((orderProduct)=>{
  res.render('admin/order-status',{admin:true,layout:'admin-layouts',orderProduct,order:true})
})
}catch(err){
  next(err)
}
})
// change delivery status
router.get('/change-status/:id',verifyLogin,(req,res,next)=>{
  try{
  let status='deliverd'
  producthelpers.changeDeliveryStatus(req.params.id,status).then(()=>{
    resolve()
    res.redirect('/admin/order-status')
  })
}catch(err){
  next(err)
}
})
// shiiped status
router.get('/change-status0/:id',verifyLogin,(req,res,next)=>{
  try{
  let status='shipped'
  producthelpers.changeDeliveryStatus(req.params.id,status).then(()=>{
    resolve()
    res.redirect('/admin/order-status')
  })
}catch(err){
  next(err)
}
})

router.get('/change-status1/:id1',verifyLogin,(req,res,next)=>{
  try{
  let status='pending'
  producthelpers.changeDeliveryStatus(req.params.id1,status).then(()=>{
    resolve()
    res.redirect('/admin/order-status')
  })
}catch(err){
  next(err)
}
})
//
router.get('/change-status2/:id2',verifyLogin,(req,res,next)=>{
  try{
  let status='cancel'
  producthelpers.changeDeliveryStatus(req.params.id2,status).then(()=>{
    resolve()
    res.redirect('/admin/order-status')
  })
}catch(err){
  next(err)
}
})
// placed status
router.get('/change-status3/:id2',verifyLogin,(req,res,next)=>{
  try{
  let status='placed'
  producthelpers.changeDeliveryStatus(req.params.id2,status).then(()=>{
    resolve()
    res.redirect('/admin/order-status')
  })
}catch(err){
  next(err)
}
})
// category management
router.get('/category-manage',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.getAllCategory().then((addCategory)=>{
    adminHelpers.getAllSubcategory().then((subcategory)=>{
      res.render('admin/category-manage',{admin:true,layout:'admin-layouts',addCategory,subcategory,category:true})
    })
  })
}catch(err){
  next(err)
}
})
// add add category
router.get('/categoryadd',verifyLogin,(req,res)=>{
  res.render('admin/categoryadd',{admin:true,layout:'admin-layouts'})
})
// category add post req 
router.post('/categoryadd',verifyLogin,(req,res)=>{

 adminHelpers.addCategory1(req.body).then(()=>{
  res.redirect('/admin/category-manage')
 })

})
// sub catyegory rendering
router.get('/subcategory',verifyLogin,(req,res)=>{
  res.render('admin/subcategory',{admin:true,layout:'admin-layouts'})
})
//post req sub category
router.post('/subcategory',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.addSubCategory(req.body).then(()=>{
    res.redirect('/admin/category-manage')
  })
  }catch(err){
    next(err)
  }
})
// edit category add rendering
router.get('/edit-categoryadd/:CId',verifyLogin,(req,res,next)=>{  
  try{
  adminHelpers.getCategory(req.params.CId).then((ecategory)=>{
   res.render('admin/edit-categoryadd',{admin:true,layout:'admin-layouts',ecategory})
  })
}catch(err){
  next(err)
}
})
/// edit categry add post req
router.post('/edit-categoryadd/:CID',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.addCategory(req.body,req.params.CID).then(()=>{
    res.redirect('/admin/category-manage')
  })
}catch(err){
  next(err)
}
})
// delete category
router.get('/delete-categoryadd/:CID',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.deleteCategoryAdd(req.params.CID).then(()=>{
    res.redirect('/admin/category-manage')
  })
}catch(err){
  next(err)
}
})
// edit sub category rendering
router.get('/edit-subcategory/:SUBID',verifyLogin,(req,res,next)=>{
try{
  adminHelpers.getSubCategoryOne(req.params.SUBID).then((subcategory)=>{
    console.log(subcategory);
    res.render('admin/edit-subcategory',{admin:true,layout:'admin-layouts',subcategory})
  })
}catch(err){
  next(err)
}
})
// update data subcategory data
router.post('/edit-subcategory/:SUBID',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.updateSubCategory(req.body,req.params.SUBID).then(()=>{
    res.redirect('/admin/category-manage')
  })
}catch(err){
  next(err)
}
})
//delete sub category
router.get('/delete-subcategory/:DID',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.deleteSubCategory(req.params.DID).then(()=>{
    res.redirect('/admin/category-manage')
  })
}catch(err){
  next(err)
}
})
// banner rendering
router.get('/banner',verifyLogin,(req,res,next)=>{
  try{
    producthelpers.getBanner().then((banner1)=>{
    console.log(banner1);
    res.render('admin/banner',{banner1,admin:true,layout:'admin-layouts',banner:true})
  })
}catch(err){
  next(err)
}
})
// add banner page rendering 
router.get('/add-banner',verifyLogin,(req,res)=>{
  res.render('admin/add-banner',{admin:true,layout:'admin-layouts'})
})
// photos post req 
router.post('/add-banner',verifyLogin,(req,res,next)=>{
  try{
  let data=req.body
  data.status=true
  producthelpers.addBanner(data).then((id)=>{
    let image=req.files.image
    image.mv('./public/banner-images/'+id+'.jpeg',(err,done)=>{
      if(err){
       // console.log(err);
        console.log('banner image errline 394');
        res.redirect('/admin/add-banner')
      }else{
        res.redirect('/admin/banner')

      }
      // res.redirect('/admin/banner')

    })
  })
}catch(err){
  next(err)
}
})
// find banner products
router.get('/edit-banner/:proId',verifyLogin,(req,res,next)=>{
try{
  adminHelpers.getBanner(req.params.proId).then((products)=>{
    console.log(products);
    res.render('admin/edit-banner',{admin:true,layout:'admin-layouts',products})

  })
}catch(err){
  next(err)
}
})
// edit banner 
router.post('/edit-banner/:proId',verifyLogin,(req,res,next)=>{
  try{
  let id=req.params.proId
  adminHelpers.editBanner(req.body,req.params.proId).then(()=>{
    res.redirect('/admin/banner')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/banner-images/'+id+'.jpeg')
    }
  })
}catch(err){
  next(err)
}
})
// delete banner
router.get('/delete-banner/:proId',verifyLogin,(req,res,next)=>{
  try{
  adminHelpers.deleteBanner(req.params.proId).then((response)=>{
    res.redirect('/admin/banner')
  })
}catch(err){
  next(err)
}
})
// banner enable
router.get('/enable-banner/:proId',verifyLogin,(req,res,next)=>{
  try{
  let data=true
  adminHelpers.enableBanner(req.params.proId,data).then((response)=>{
    res.redirect('/admin/banner')
  })
}catch(err){
  next(err)
}
})
// desable banner
router.get('/desable-banner/:proId',verifyLogin,(req,res,next)=>{
  try{
  let data=false
  adminHelpers.enableBanner(req.params.proId,data).then((response)=>{
    res.redirect('/admin/banner')
  })
}catch(err){
  next(err)
}
})

// error 
router.get('/*',(req,res)=>{
  res.render('admin/error',{layout:'admin-layouts'})
})






module.exports = router;
