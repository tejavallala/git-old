const express= require("express");
const adminModel=require("../model/adminModel");
const adminRoute=new express.Router();

adminRoute.post("/create-admin",async (req,res) => {
    try{
    const data=await adminModel.create(req.body);
    res.json(data)
    }catch(err){
        res.staus(500).json({error:err.message});
    }
});
adminRoute.get("/get-admin/:id",async(req,res)=>{
    try{
        const data=await adminModel.findById(req.params.id);
        res.json(data);
    }catch(err){
        res.staus(500).json({error:err.message});
    }
});
module.exports=adminRoute;