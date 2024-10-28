"use strict";

import { ObjectId } from "mongodb";
import { getDb } from "./db.mjs";
import { getUser } from "./user.mjs";
import { getStatus} from "./statuses.mjs"

export async function getFavorites(curr_user, user_id, screen_name, count) {
    
    
    const user = await getUser(screen_name, user_id)
    

    if (!user.hasOwnProperty("favorited_slimes")){
        return
    }
    const limit = parseInt(count) ||  user.favorited_slimes.length


    
    const favorites = user.favorited_slimes.slice(0, limit)
    
    // if favorite is a reslime
    const results = await Promise.all(favorites.map(async (slime) => {
        return await getStatus(curr_user, slime);
    }));

    return results;
    
}