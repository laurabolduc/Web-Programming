"use strict"

import { ObjectId } from "mongodb";
import { getDb } from "./db.mjs";
import { getUser } from "./user.mjs";

/**
 * returns manufactured slime object
 * @param {*} curr_user the user who is logged in 
 * @param {*} id the id of the slime we are looking at 
 * @returns 
 */
export async function getStatus(curr_user, id) {
    const db = await getDb(); 
    const col = db.collection("slimes"); 
    // found the slime info 
    const result = await col.findOne({
        _id : new ObjectId(id) 
    }); 
    
    if(!result){
        
        return{
            "message" : "slime not found"
        };
    }
    // found who posted it 
    const user = await getUser(null, result.user_id_str); 
    // the current user id str
    const curr = await getUser(curr_user, null);
    // has it been reslimed 
    // look at the current users reslimes and if its there return boolean
    let isres = false; 
    if(result.hasOwnProperty('reslimed_status_id_str')){
        isres = await isReslime(curr.id_str, id);
    }else if (result.hasOwnProperty('in_reply_to_status_id_str')){
        isres = await isReslime(curr.id_str, result.in_reply_to_status_id_str )
    }
    
     
    let isfav = false;
    if(curr.favorited_slimes.includes(id.toString())){
        isfav = true;  
    }else if(result.hasOwnProperty("reslimed_status_id_str")){
        isfav = curr.favorited_slimes.includes(result.reslimed_status_id_str.toString())
    }
    

    //format returns 
    if(result.hasOwnProperty("reslimed_status_id_str")){
        return await reSlime(result, user,isfav, isres)
    }
    return Slime(result, user, isres, isfav);  
}

function Slime(result, user, isres, isfav){
    return {
        ...result, 
        user,
        reslimed: isres,
        favorited: isfav,
        id_str: result._id
    };
}

async function reSlime(result, user, isfav, isres){
    // get the original slime 
    const db = await getDb(); 
    const col = db.collection("slimes"); 
    const original = await col.findOne(
        {
            _id : new ObjectId(result.reslimed_status_id_str)
        }  
    );
 
    const slime = await col.findOne({
        _id : new ObjectId(result.reslimed_status_id_str)
    }); 

    const slimeauthor = await getUser(null, slime.user_id_str);
    return {
            ...result, 
            user,
            reslimed: isres,
            favorited: isfav,
            reslimed_status : {...original, user : slimeauthor, id_str : slime._id},
            id_str: result._id
    }
}

export async function getReslimes(curr_user, id, number){
    
    const db = await getDb();
    const col = db.collection("slimes");
    const limit = parseInt(number) ||  await col.countDocuments({reslimed_status_id_str: id})

    const resp = await col.find({
        reslimed_status_id_str: id
    }).limit(limit).toArray();

    // map small reslimes to large reslimes to get full information
     const newRes =  await Promise.all(resp.map(async (x) => {
        //console.log(x)
        
        const y = await getStatus(curr_user, x._id)
        //console.log("THis" ,y)
        return y
    
    }))
    //console.log("NewRes", newRes)
    return newRes
}

// returns replies for a slimes
export async function getReplies(curr_user, id){
    const db = await getDb(); 
    const col = db.collection("slimes"); 

    const res = await col.aggregate([
        {
            $match : {
                in_reply_to_status_id_str : id
            }
        }
        
    ]).toArray();

    const results = await Promise.all(res.map(async (reply) => {
        return await getStatus(curr_user, reply._id);
    }));
       
    return results
}



/**
 * returns all slimes for home_timeline and reslimes ? 
 * @param {*} curr_user 
 * @returns 
 */
export async function getAllSlimes(curr_user){
    const db = await getDb(); 
    const col = db.collection("slimes"); 
    const res = await col.find({}).toArray(); 

    const results = await Promise.all(res.map(async (slime) => {
        console.log("slime", slime)
        return await getStatus(curr_user, slime._id);
    }));
    return results; 
}



/**
 * finds out if a slime is reslimed 
 * @param {*} curr_user the user who is currently loggen in id str
 * @param {*} slime_id the slime we are interested in 
 * @returns boolean
 */
export async function isReslime(curr_user, slime_id){
    const db = await getDb();
    const col = db.collection("slimes");
    // find out if a slime was reslimed by this user 
     
    const result = await col.find({
        _id : new ObjectId(slime_id),
        user_id_str: curr_user
    }).hasNext();
    
    if(result){
        return true
    }
    return false;
}

export async function getReslimesOfMe(curr_user, user_id, count) {

    const reslimes = await getUserTimeline(curr_user, user_id, count);
    return reslimes.filter((r) => {
        if (r.hasOwnProperty('reslimed_status_id_str')){
            return true;
        }
        return false;
    });
}

export async function getUserTimeline(curr_user, screen_name, user_id, count) {
    
    const db = await getDb(); 
    const col = db.collection("slimes"); 
    const user = await getUser(screen_name, user_id)

    const limit = parseInt(count) ||  await col.countDocuments({user_id_str: user_id});
    const res = await col.find({
            user_id_str: user.id_str.toString(),

    }).sort({
        created_at: -1
    }).limit(limit).toArray(); 
   
    const results = await Promise.all(res.map(async (slime) => {
        return await getStatus(curr_user, slime._id);
    }));
    
    return results; 
}   

export async function getActivity(curr_user, count) {
    const db = await getDb(); 
    const col = db.collection("slimes"); 
    const limit = parseInt(count) ||  await col.countDocuments({user_id_str: curr_user});
    let replies = await getReplies(curr_user, count);
    let reslimes = await getReslimes(curr_user, count);
    let allActivity = replies.concat(reslimes).sort({
        created_at: -1
    });
   
    return allActivity.slice(0, limit);
    
}   





