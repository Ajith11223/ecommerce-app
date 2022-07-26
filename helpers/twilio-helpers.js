const async = require('hbs/lib/async')
const { reject } = require('lodash')
const { resolve } = require('promise')
require('dotenv').config()

const client=require('twilio')(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)
const serviceSid= process.env.TWILIO_SERVICE_SID

module.exports={
    doSms:(noData)=>{
        let res={}
        return new Promise(async(resolve,reject)=>{
            try{
            client.verify.services(serviceSid).verifications.create({
                to:`+91${noData.phone}`,
                channel:'sms'
            }).then((res)=>{
                  res.valid=true
                  resolve(res)
            })
        }catch(err){
            reject(err)
        }
        })
    },
    //otp verify
    otpVerify:(otpData,userData)=>{
        let resp={}
        return new Promise(async(resolve,reject)=>{
            try{
          await client.verify.services(serviceSid).verificationChecks.create({
                to:  `+91${userData.phone}`,
                code:otpData.otp
            }).then((resp)=>{
                resolve(resp)
            })
        }catch(err){
            reject(err)
        }
        })
    }

}