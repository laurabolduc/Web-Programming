"use strict"

import express from "express";
import { getStatus, getReplies, getAllSlimes, getReslimes, getUserTimeline, getReslimesOfMe, getActivity } from "../models/statuses.mjs";

const router = express.Router();

// TODO add any endpoints or middleware functions here
function isSignedIn(req) {
    return req.session._id !== undefined
}

router.get("/home_timeline.json", async (req, res) => {
    if (!isSignedIn(req)) {
        res.status(400);
        res.json({
            "message": "Must be signed"
        });
        return;
    }
    res.json(await getAllSlimes(req.session.username));
});

router.get("/user_timeline.json", async (req, res) => {
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

router.get("/activity.json", async (req, res) => {
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

router.get("/replies/:id.json", async (req, res) => {
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

router.get("/show/:id.json", async (req, res) => {
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

router.get("/reslimes/:id.json", async (req, res) => {
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

router.get("/reslimes_of_me.json", async (req, res) => {
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

export default router;
