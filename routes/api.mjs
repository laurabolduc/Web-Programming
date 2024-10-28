"use strict";

import express from "express";
import { validateUser, createUser, getUser } from "../models/user.mjs";
import { getStatus, getReplies, getAllSlimes, getReslimes, getUserTimeline, getReslimesOfMe, getActivity } from "../models/statuses.mjs";
import { getFavorites } from "../models/favorites.mjs";


const router = express.Router();

// TODO add any endpoints or middleware functions here
function isSignedIn(req) {
    return req.session._id !== undefined
}

router.get("/statuses/home_timeline.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed"
        });
        return;
    }
    res.json(await getAllSlimes(req.session.username));
});

router.get("/statuses/user_timeline.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be singed in to get the user's timeline"
        });
        return;
    }

    const count = req.query.count
    let id = req.query.user_id
    let username = req.query.screen_name
    if (!id){
        id = req.session.user_id
    } 
    if (!username) {
        username = req.session.username
    }
    res.json(await getUserTimeline( req.session.username, username, id, count));
});

router.get("/statuses/activity.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be singed in to get the user's timeline"
        });
        return;
    }

    const count = req.query.count
    res.json(await getActivity( req.session.username, count));
});

router.get("/statuses/replies/:id.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed in to get user"
        });
        return;
    }
    const id = req.params.id;
    const count = req.params.count;
    // returns an array of slimes 
    const replies = await getReplies(req.session.username, id);
    if (count) {
        res.json({
            ...replies,
            count: replies.length()
        });
    }
    else {
        res.json(replies);
    }
});

router.get("/statuses/show/:id.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed in to get slimes"
        });
        return;
    }
    const id = req.params.id;
    // slime id 
    const slime = await getStatus(req.session.username, id);

    res.json({
        ...slime
    });
});

router.get("/statuses/reslimes/:id.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed in to get reslimes"
        });
        return;
    }
    const id = req.params.id;
    const number = req.query.count;
    const slimes = await getReslimes(req.session.username, id, number);
    res.json({
        slimes
    });
    return;
});

router.get("/statuses/reslimes_of_me.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed in to get user"
        });
        return;
    }
    
    const count = req.query.count
    let user_id = req.query.user_id;
    let user_name = req.query.screen_name;

    if (!user_id && !user_name){
        user_id = req.session._id;
        user_name= req.session.username;
    }

    const reslimeOfMe = await getReslimesOfMe(user_name, user_id, count);

    res.json(
        reslimeOfMe
    );
});


router.get("/user/get.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed in to get user"
        });
        return;
    }

    const user_id = req.query.user_id;
    const user_name = req.query.screen_name;
    // if the user or the user_id is

    const get_user = await getUser(user_name, user_id);
    if (!get_user) {
        res.json(await getUser(req.session.username));
        return;
    }
    res.json(
        await getUser(user_name, user_id)
    );


    /**
     * FIXME: I am gettign back "get_user: false" but its not crashing/returning a 400 response code. 
     * I think the issue has to do with how i am accessing the user ID and username.
     */
});

router.get("/favorites/list.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed in to get reslimes"
        });
        return;
    }
    let user_id = req.query.user_id;
    let user_name = req.query.screen_name;
    const count = req.query.count;

    if (!user_id && !user_name){
        user_id = req.session._id
        user_name= req.session.username
    }
    // FIXME: Make it so it works for the currently authenticated user if no params are specified
    const getFav = await getFavorites(req.session.username, user_id, user_name, count);
    //console.log("FAVVV",getFav)
    res.json(
        getFav
    );
});

router.post("/login", async (req, res) => {
    if (req.session._id) {
        res.json({
            "message": "already there ",
            "username": req.session.username
        });
        return
    }
    const keys = ["username", "password"];
    if (!keys.every((e) => req.body.hasOwnProperty(e))) {
        res.status(400);
        res.json({
            "message": "Invalid Username or password"
        })
        return;
    }

    const valid = await validateUser(req.body.username, req.body.password);
    if (!valid) {
        res.status(400);
        res.json({
            "message": "User not valid"
        })
        return;
    }

    // store session username and 
    req.session.username = req.body.username
    req.session._id = valid._id
    res.json({
        "message": "Welcome to slugfest!",
        "username": req.body.username
    });
});

router.get("/logout", (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "must be signed in order to logout "
        });
        return;
    }

    req.session.destroy();
    res.json({
        "message": "Goodbye!"
    });
});

//register handler
router.post("/register", async (req, res) => {
    // check that the request has a username and password
    const keys = ["username", "password"]
    if (!keys.every((e) => req.body.hasOwnProperty(e))) {
        // Error this is a malformed registration request
        res.status(400);
        res.json({
            "message": "todo must have a username and a password field"
        })
        return;
    }

    // create the user
    const user = await createUser(req.body.username, req.body.password);

    // store username and _id as part of session
    req.session.username = user.username;
    req.session._id = user._id;

    // send back a confirmation message
    res.json({
        "message": "registration successful",
        "username": user.username
    });
});
export default router;
