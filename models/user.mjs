"use strict"; 

// data model for interacting with user accounts 
import argon2 from "argon2"; 
import { getDb } from "./db.mjs";
import  sanitize  from "mongo-sanitize"; 
import { ObjectId } from "mongodb";

// configure the argon2 hash function to suport best practicies 
const argon_config = {
    type: argon2.argon2id, 
    memoryCost: 15360 // in KiB

};

// what do we want to supporty
export async function createUser(username, password){

    const db = await getDb(); 
    const col = db.collection("users"); 
    // TODO check that user is not in the database already
    //hash the password 
    const user_data = {
        username: sanitize(username), 
        password: await argon2.hash(password, argon_config)
    }; 

    //anytime you take data from a client or end user , sanitize is 
    const result = await col.insertOne(user_data); 
    console.log(result);
    return {
        ...user_data,  // spread operator, expand then extend it with the id field 
        _id: result.insertedId
    }; 
}

export async function validateUser(username, password){
    const db = await getDb(); 
    const col =  db.collection("users"); 

    const user = await col.findOne({
        username : sanitize(username)
    }); 

    // fix me  what is the user is not found 
    if(!user){
        return false
    }

    // check that a password matches the stored hash 
    const verify = await argon2.verify(user.password, password); 
    if(verify){
        return {
            username : user.username, 
            _id : user._id
        }
    }
    else{
        return false
    }
}

// but if no params are specified then return the authenticated user.
export async function getUser(screen_name, user_id) {
    const db = await getDb(); 
    const col = db.collection("users"); 
    const sn = screen_name || undefined; 
    const ui = user_id || undefined; 
    if(screen_name || user_id ){
        const user = await col.findOne({
            $or: [
                { username: sanitize(screen_name) },
                { _id:new ObjectId(user_id) }
            ]
        }, {
            projection: {
              password: 0,
              email: 0
            }});
            const id = user._id;
            const screen = user.username;
            delete user["_id"];
            delete user["username"]
       // Last time it work 
        return {
            ...user,
            screen_name: `@${screen}`,
            id_str: `${id}`
        }; 
    }
    return; 
}

